-- Bulk card import: increment profile flashcard_count by N in one call

CREATE OR REPLACE FUNCTION public.increment_flashcard_count_by(user_id uuid, amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM user_id THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  IF amount IS NULL OR amount <= 0 THEN
    RETURN;
  END IF;
  UPDATE profiles
  SET flashcard_count = coalesce(flashcard_count, 0) + amount
  WHERE id = user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_flashcard_count_by(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_flashcard_count_by(uuid, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.increment_flashcard_count_by(uuid, integer) TO authenticated;
