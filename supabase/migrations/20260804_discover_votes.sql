-- Discover voting: aggregate public score with one signed-in vote per user.

CREATE TABLE IF NOT EXISTS public.discover_subject_votes (
  subject_id bigint NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_value smallint NOT NULL CHECK (vote_value IN (-1, 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (subject_id, user_id)
);

CREATE INDEX IF NOT EXISTS discover_subject_votes_subject_idx
  ON public.discover_subject_votes (subject_id);

CREATE INDEX IF NOT EXISTS discover_subject_votes_user_idx
  ON public.discover_subject_votes (user_id);

ALTER TABLE public.discover_subject_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS discover_votes_select_own ON public.discover_subject_votes;
CREATE POLICY discover_votes_select_own ON public.discover_subject_votes
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS discover_votes_insert_own ON public.discover_subject_votes;
CREATE POLICY discover_votes_insert_own ON public.discover_subject_votes
  FOR INSERT TO authenticated
  WITH CHECK (
    (select auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM public.subject_listings l
      JOIN public.subjects s ON s.id = l.subject_id
      WHERE l.subject_id = discover_subject_votes.subject_id
        AND l.published_at IS NOT NULL
        AND l.pricing = 'free'
        AND s.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS discover_votes_update_own ON public.discover_subject_votes;
CREATE POLICY discover_votes_update_own ON public.discover_subject_votes
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK (
    (select auth.uid()) = user_id
    AND vote_value IN (-1, 1)
  );

DROP POLICY IF EXISTS discover_votes_delete_own ON public.discover_subject_votes;
CREATE POLICY discover_votes_delete_own ON public.discover_subject_votes
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.discover_subject_votes TO authenticated;

CREATE OR REPLACE FUNCTION public.set_discover_vote(
  p_subject_id bigint,
  p_vote_value smallint
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_vote_value NOT IN (-1, 1) THEN
    RAISE EXCEPTION 'vote_value must be -1 or 1';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.subject_listings l
    JOIN public.subjects s ON s.id = l.subject_id
    WHERE l.subject_id = p_subject_id
      AND l.published_at IS NOT NULL
      AND l.pricing = 'free'
      AND s.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Subject is not available in Discover';
  END IF;

  INSERT INTO public.discover_subject_votes (subject_id, user_id, vote_value)
  VALUES (p_subject_id, v_user_id, p_vote_value)
  ON CONFLICT (subject_id, user_id)
  DO UPDATE SET
    vote_value = EXCLUDED.vote_value,
    updated_at = now();

  RETURN json_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.clear_discover_vote(p_subject_id bigint)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  DELETE FROM public.discover_subject_votes
  WHERE subject_id = p_subject_id
    AND user_id = v_user_id;

  RETURN json_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.set_discover_vote(bigint, smallint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_discover_vote(bigint, smallint) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_discover_vote(bigint, smallint) TO authenticated;

REVOKE ALL ON FUNCTION public.clear_discover_vote(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.clear_discover_vote(bigint) FROM anon;
GRANT EXECUTE ON FUNCTION public.clear_discover_vote(bigint) TO authenticated;

DROP FUNCTION IF EXISTS public.list_discover_subjects(text, text);

CREATE OR REPLACE FUNCTION public.list_discover_subjects(
  p_search text DEFAULT NULL,
  p_category text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
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
        l.category,
        COALESCE(vote_stats.upvote_count, 0) AS upvote_count,
        COALESCE(vote_stats.downvote_count, 0) AS downvote_count,
        COALESCE(vote_stats.score, 0) AS score,
        viewer_vote.vote_value AS viewer_vote
      FROM public.subject_listings l
      JOIN public.subjects s ON s.id = l.subject_id
      LEFT JOIN public.profiles p ON p.id = l.publisher_id
      LEFT JOIN (
        SELECT
          dsv.subject_id,
          count(*) FILTER (WHERE dsv.vote_value = 1) AS upvote_count,
          count(*) FILTER (WHERE dsv.vote_value = -1) AS downvote_count,
          COALESCE(sum(dsv.vote_value), 0) AS score
        FROM public.discover_subject_votes dsv
        GROUP BY dsv.subject_id
      ) AS vote_stats ON vote_stats.subject_id = l.subject_id
      LEFT JOIN public.discover_subject_votes AS viewer_vote
        ON viewer_vote.subject_id = l.subject_id
       AND viewer_vote.user_id = v_user_id
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
