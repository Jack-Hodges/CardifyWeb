-- Unique Discover display username on profiles

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS username text;

-- Normalize empties to null; enforce uniqueness case-insensitively via lower()
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx
  ON profiles (lower(username))
  WHERE username IS NOT NULL;

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_username_format;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_username_format
  CHECK (
    username IS NULL
    OR username ~ '^[a-z0-9_]{3,20}$'
  );

-- Include publisher username on Discover catalog
CREATE OR REPLACE FUNCTION list_discover_subjects(p_search text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((
    SELECT json_agg(row_to_json(t) ORDER BY t.published_at DESC)
    FROM (
      SELECT
        s.id,
        s.name,
        s."colourText",
        s."colourIntensity",
        s.flashcard_count,
        l.publisher_id,
        p.username AS publisher_username,
        l.description,
        l.pricing,
        l.price_cents,
        l.published_at
      FROM subject_listings l
      JOIN subjects s ON s.id = l.subject_id
      LEFT JOIN profiles p ON p.id = l.publisher_id
      WHERE l.published_at IS NOT NULL
        AND l.pricing = 'free'
        AND s.deleted_at IS NULL
        AND (
          p_search IS NULL
          OR length(trim(p_search)) = 0
          OR s.name ILIKE '%' || trim(p_search) || '%'
          OR COALESCE(l.description, '') ILIKE '%' || trim(p_search) || '%'
          OR COALESCE(p.username, '') ILIKE '%' || trim(p_search) || '%'
        )
      ORDER BY l.published_at DESC
      LIMIT 100
    ) t
  ), '[]'::json);
END;
$$;

CREATE OR REPLACE FUNCTION get_discover_subject(p_subject_id bigint)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'subject', json_build_object(
      'id', s.id,
      'name', s.name,
      'colourText', s."colourText",
      'colourIntensity', s."colourIntensity",
      'flashcard_count', s.flashcard_count
    ),
    'listing', json_build_object(
      'description', l.description,
      'pricing', l.pricing,
      'price_cents', l.price_cents,
      'published_at', l.published_at,
      'publisher_username', p.username
    ),
    'cards', COALESCE((
      SELECT json_agg(json_build_object(
        'id', f.id,
        'question', f.question,
        'answer', f.answer,
        'frontMode', f."frontMode",
        'backMode', f."backMode",
        'image_url', f.image_url,
        'sort_order', f.sort_order
      ) ORDER BY COALESCE(f.sort_order, f.id))
      FROM flashcards f
      WHERE f.subject_id = s.id AND f.deleted_at IS NULL
    ), '[]'::json)
  )
  INTO result
  FROM subject_listings l
  JOIN subjects s ON s.id = l.subject_id
  LEFT JOIN profiles p ON p.id = l.publisher_id
  WHERE l.subject_id = p_subject_id
    AND l.published_at IS NOT NULL
    AND l.pricing = 'free'
    AND s.deleted_at IS NULL;

  RETURN result;
END;
$$;
