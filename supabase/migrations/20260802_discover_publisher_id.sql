-- Include publisher_id on Discover subject payload for ownership checks

CREATE OR REPLACE FUNCTION public.get_discover_subject(p_subject_id bigint)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

GRANT EXECUTE ON FUNCTION public.get_discover_subject(bigint) TO anon, authenticated;
