-- Admin search + mutations. Callers must already be profiles.admin.
-- Protected columns are written as the function owner (postgres).

CREATE OR REPLACE FUNCTION private.assert_admin()
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT coalesce((SELECT admin FROM public.profiles WHERE id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION private.admin_overview()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'users_total', (SELECT count(*) FROM public.profiles),
    'users_pro', (SELECT count(*) FROM public.profiles WHERE coalesce(pro, false) OR coalesce(unlimited, false)),
    'users_admin', (SELECT count(*) FROM public.profiles WHERE coalesce(admin, false)),
    'users_today', (SELECT count(*) FROM public.profiles WHERE created_at::date = CURRENT_DATE),
    'users_7d', (SELECT count(*) FROM public.profiles WHERE created_at >= CURRENT_DATE - 6),
    'users_30d', (SELECT count(*) FROM public.profiles WHERE created_at >= CURRENT_DATE - 29),
    'flashcards_live', (SELECT count(*) FROM public.flashcards WHERE deleted_at IS NULL),
    'subjects_live', (SELECT count(*) FROM public.subjects WHERE deleted_at IS NULL),
    'listings', (SELECT count(*) FROM public.subject_listings),
    'sessions_7d', (
      SELECT count(*) FROM public.study_sessions
      WHERE started_at >= (now() - interval '7 days')
    ),
    'signups_by_day', (
      SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY d.day), '[]'::jsonb)
      FROM (
        SELECT created_at::date AS day, count(*)::integer AS count
        FROM public.profiles
        WHERE created_at >= (CURRENT_DATE - 13)
        GROUP BY 1
      ) d
    )
  );
$$;

CREATE OR REPLACE FUNCTION private.admin_search_users(p_search text, p_limit integer, p_offset integer)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH filtered AS (
    SELECT
      id,
      username,
      first_name,
      avatar_url,
      created_at,
      coalesce(pro, false) AS pro,
      coalesce(unlimited, false) AS unlimited,
      coalesce(admin, false) AS admin,
      coalesce(flashcard_count, 0) AS flashcard_count,
      coalesce(generation_count, 0) AS generation_count
    FROM public.profiles
    WHERE p_search IS NULL
      OR btrim(p_search) = ''
      OR username ILIKE '%' || btrim(p_search) || '%'
      OR first_name ILIKE '%' || btrim(p_search) || '%'
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM filtered),
    'users', coalesce((
      SELECT jsonb_agg(to_jsonb(u) ORDER BY u.created_at DESC NULLS LAST)
      FROM (
        SELECT * FROM filtered
        ORDER BY created_at DESC NULLS LAST
        LIMIT greatest(1, least(coalesce(p_limit, 40), 100))
        OFFSET greatest(0, coalesce(p_offset, 0))
      ) u
    ), '[]'::jsonb)
  );
$$;

CREATE OR REPLACE FUNCTION private.admin_update_user(
  p_user_id uuid,
  p_pro boolean,
  p_unlimited boolean,
  p_admin boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result public.profiles;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Missing user' USING ERRCODE = '22023';
  END IF;

  IF p_user_id = auth.uid() AND p_admin IS NOT DISTINCT FROM false THEN
    RAISE EXCEPTION 'You cannot remove your own admin access' USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles
  SET
    pro = coalesce(p_pro, pro),
    unlimited = coalesce(p_unlimited, unlimited),
    admin = coalesce(p_admin, admin)
  WHERE id = p_user_id
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN jsonb_build_object(
    'id', result.id,
    'username', result.username,
    'first_name', result.first_name,
    'avatar_url', result.avatar_url,
    'created_at', result.created_at,
    'pro', coalesce(result.pro, false),
    'unlimited', coalesce(result.unlimited, false),
    'admin', coalesce(result.admin, false),
    'flashcard_count', coalesce(result.flashcard_count, 0),
    'generation_count', coalesce(result.generation_count, 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION private.admin_reset_generation(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE public.profiles
  SET generation_count = 0
  WHERE id = p_user_id
  RETURNING generation_count INTO new_count;

  IF new_count IS NULL AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN jsonb_build_object('id', p_user_id, 'generation_count', 0);
END;
$$;

CREATE OR REPLACE FUNCTION private.admin_recalc_flashcard_count(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  live_count integer;
BEGIN
  SELECT least(count(*), 32767)::integer
  INTO live_count
  FROM public.flashcards
  WHERE user_id = p_user_id
    AND deleted_at IS NULL;

  UPDATE public.profiles
  SET flashcard_count = coalesce(live_count, 0)::smallint
  WHERE id = p_user_id;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN jsonb_build_object('id', p_user_id, 'flashcard_count', coalesce(live_count, 0));
END;
$$;

CREATE OR REPLACE FUNCTION private.admin_list_user_subjects(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.deleted, s.created_at DESC), '[]'::jsonb)
  FROM (
    SELECT
      sub.id,
      sub.name,
      coalesce(sub.flashcard_count, 0) AS flashcard_count,
      coalesce(sub.published, false) AS published,
      (sub.deleted_at IS NOT NULL) AS deleted,
      EXISTS (
        SELECT 1 FROM public.subject_listings l WHERE l.subject_id = sub.id
      ) AS listed,
      sub.created_at
    FROM public.subjects sub
    WHERE sub.user_id = p_user_id
    ORDER BY (sub.deleted_at IS NOT NULL), sub.created_at DESC
    LIMIT 80
  ) s;
$$;

CREATE OR REPLACE FUNCTION private.admin_unpublish_subject(p_subject_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.subjects
  SET published = false
  WHERE id = p_subject_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subject not found' USING ERRCODE = 'P0002';
  END IF;

  DELETE FROM public.subject_listings WHERE subject_id = p_subject_id;

  RETURN jsonb_build_object('id', p_subject_id, 'published', false, 'listed', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_overview()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM private.assert_admin();
  RETURN private.admin_overview();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_search_users(p_search text DEFAULT NULL, p_limit integer DEFAULT 40, p_offset integer DEFAULT 0)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM private.assert_admin();
  RETURN private.admin_search_users(p_search, p_limit, p_offset);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_user(
  p_user_id uuid,
  p_pro boolean DEFAULT NULL,
  p_unlimited boolean DEFAULT NULL,
  p_admin boolean DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM private.assert_admin();
  RETURN private.admin_update_user(p_user_id, p_pro, p_unlimited, p_admin);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reset_generation(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM private.assert_admin();
  RETURN private.admin_reset_generation(p_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_recalc_flashcard_count(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM private.assert_admin();
  RETURN private.admin_recalc_flashcard_count(p_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_user_subjects(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM private.assert_admin();
  RETURN private.admin_list_user_subjects(p_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_unpublish_subject(p_subject_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM private.assert_admin();
  RETURN private.admin_unpublish_subject(p_subject_id);
END;
$$;

REVOKE ALL ON FUNCTION private.assert_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.admin_overview() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.admin_search_users(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.admin_update_user(uuid, boolean, boolean, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.admin_reset_generation(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.admin_recalc_flashcard_count(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.admin_list_user_subjects(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.admin_unpublish_subject(bigint) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.get_admin_overview() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_search_users(text, integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_update_user(uuid, boolean, boolean, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_reset_generation(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_recalc_flashcard_count(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_user_subjects(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_unpublish_subject(bigint) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_admin_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_search_users(text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user(uuid, boolean, boolean, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_generation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_recalc_flashcard_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_user_subjects(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_unpublish_subject(bigint) TO authenticated;
