-- Discover catalog categories (global taxonomy, not dashboard collections)

ALTER TABLE public.subject_listings
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'other';

ALTER TABLE public.subject_listings
  DROP CONSTRAINT IF EXISTS subject_listings_category_check;

ALTER TABLE public.subject_listings
  ADD CONSTRAINT subject_listings_category_check
  CHECK (category IN ('geography', 'science', 'languages', 'history', 'general', 'other'));

CREATE INDEX IF NOT EXISTS subject_listings_category_published_idx
  ON public.subject_listings (category, published_at DESC)
  WHERE published_at IS NOT NULL;

-- Browse catalog with optional category filter
DROP FUNCTION IF EXISTS public.list_discover_subjects(text);

CREATE OR REPLACE FUNCTION public.list_discover_subjects(
  p_search text DEFAULT NULL,
  p_category text DEFAULT NULL
)
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
        l.published_at,
        l.category
      FROM subject_listings l
      JOIN subjects s ON s.id = l.subject_id
      LEFT JOIN profiles p ON p.id = l.publisher_id
      WHERE l.published_at IS NOT NULL
        AND l.pricing = 'free'
        AND s.deleted_at IS NULL
        AND (
          p_category IS NULL
          OR length(trim(p_category)) = 0
          OR l.category = trim(p_category)
        )
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

GRANT EXECUTE ON FUNCTION public.list_discover_subjects(text, text) TO anon, authenticated;

-- Include category on practice payload
CREATE OR REPLACE FUNCTION public.get_discover_subject(p_subject_id bigint)
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
      'flashcard_count', s.flashcard_count,
      'user_id', s.user_id
    ),
    'listing', json_build_object(
      'description', l.description,
      'pricing', l.pricing,
      'price_cents', l.price_cents,
      'published_at', l.published_at,
      'publisher_id', l.publisher_id,
      'publisher_username', p.username,
      'category', l.category
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

GRANT EXECUTE ON FUNCTION public.get_discover_subject(bigint) TO anon, authenticated;

-- Backfill @cardify packs from known subject ids / collection mapping
UPDATE public.subject_listings AS l
SET category = v.category
FROM (VALUES
  (165, 'geography'),
  (166, 'geography'),
  (170, 'geography'),
  (172, 'geography'),
  (173, 'geography'),
  (174, 'geography'),
  (175, 'geography'),
  (164, 'science'),
  (167, 'science'),
  (169, 'science'),
  (171, 'science'),
  (176, 'science'),
  (177, 'science'),
  (178, 'science'),
  (179, 'languages'),
  (180, 'languages'),
  (181, 'history'),
  (182, 'history'),
  (168, 'general'),
  (183, 'general'),
  (184, 'general'),
  (185, 'general')
) AS v(subject_id, category)
WHERE l.subject_id = v.subject_id;
