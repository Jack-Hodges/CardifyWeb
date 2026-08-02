-- Discover: published subject catalog + per-user library (reference, not clone).
-- Reuses subjects/flashcards for content; only listing metadata + membership rows.

CREATE TABLE IF NOT EXISTS subject_listings (
  subject_id bigint PRIMARY KEY REFERENCES subjects(id) ON DELETE CASCADE,
  publisher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description text,
  -- Commerce scaffolding (app only serves free until purchases exist)
  pricing text NOT NULL DEFAULT 'free' CHECK (pricing IN ('free', 'paid')),
  price_cents integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  published_at timestamptz
);

CREATE INDEX IF NOT EXISTS subject_listings_published_idx
  ON subject_listings (published_at DESC)
  WHERE published_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS subject_library (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id bigint NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, subject_id)
);

CREATE INDEX IF NOT EXISTS subject_library_user_idx
  ON subject_library (user_id, added_at DESC);

ALTER TABLE subject_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS listings_owner ON subject_listings;
CREATE POLICY listings_owner ON subject_listings
  FOR ALL
  USING (auth.uid() = publisher_id)
  WITH CHECK (
    auth.uid() = publisher_id
    AND EXISTS (
      SELECT 1 FROM subjects s
      WHERE s.id = subject_id
        AND s.user_id = auth.uid()
        AND s.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS library_own ON subject_library;
CREATE POLICY library_own ON subject_library
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Library members can read referenced subjects + cards (practice / SRS)
DROP POLICY IF EXISTS subjects_library_read ON subjects;
CREATE POLICY subjects_library_read ON subjects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subject_library sl
      WHERE sl.subject_id = subjects.id
        AND sl.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS flashcards_library_read ON flashcards;
CREATE POLICY flashcards_library_read ON flashcards
  FOR SELECT USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM subject_library sl
      WHERE sl.subject_id = flashcards.subject_id
        AND sl.user_id = auth.uid()
    )
  );

-- Catalog browse (anon + auth). Free listings only until paid is activated.
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
        l.description,
        l.pricing,
        l.price_cents,
        l.published_at
      FROM subject_listings l
      JOIN subjects s ON s.id = l.subject_id
      WHERE l.published_at IS NOT NULL
        AND l.pricing = 'free'
        AND s.deleted_at IS NULL
        AND (
          p_search IS NULL
          OR length(trim(p_search)) = 0
          OR s.name ILIKE '%' || trim(p_search) || '%'
          OR COALESCE(l.description, '') ILIKE '%' || trim(p_search) || '%'
        )
      ORDER BY l.published_at DESC
      LIMIT 100
    ) t
  ), '[]'::json);
END;
$$;

GRANT EXECUTE ON FUNCTION list_discover_subjects(text) TO anon, authenticated;

-- Practice a free published subject (same card shape as public study token RPC)
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
      'published_at', l.published_at
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
  WHERE l.subject_id = p_subject_id
    AND l.published_at IS NOT NULL
    AND l.pricing = 'free'
    AND s.deleted_at IS NULL;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_discover_subject(bigint) TO anon, authenticated;

-- Add free published subject to the caller's library (reference)
CREATE OR REPLACE FUNCTION add_to_library(p_subject_id bigint)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM subject_listings l
    JOIN subjects s ON s.id = l.subject_id
    WHERE l.subject_id = p_subject_id
      AND l.published_at IS NOT NULL
      AND l.pricing = 'free'
      AND s.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Subject is not available in Discover';
  END IF;

  IF EXISTS (
    SELECT 1 FROM subjects s
    WHERE s.id = p_subject_id AND s.user_id = uid
  ) THEN
    RAISE EXCEPTION 'You already own this subject';
  END IF;

  INSERT INTO subject_library (user_id, subject_id)
  VALUES (uid, p_subject_id)
  ON CONFLICT (user_id, subject_id) DO NOTHING;

  RETURN json_build_object('ok', true, 'subject_id', p_subject_id);
END;
$$;

GRANT EXECUTE ON FUNCTION add_to_library(bigint) TO authenticated;
