-- Protected admin flag + overview RPC (admins only).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.protect_profile_entitlements()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.pro := false;
    NEW.unlimited := false;
    NEW.admin := false;
    NEW.flashcard_count := 0;
    NEW.generation_count := 0;
    NEW.stripe_customer_id := NULL;
    NEW.stripe_subscription_id := NULL;
    NEW.subscription_period_end := NULL;
    RETURN NEW;
  END IF;

  NEW.pro := OLD.pro;
  NEW.unlimited := OLD.unlimited;
  NEW.admin := OLD.admin;
  NEW.flashcard_count := OLD.flashcard_count;
  NEW.generation_count := OLD.generation_count;
  NEW.stripe_customer_id := OLD.stripe_customer_id;
  NEW.stripe_subscription_id := OLD.stripe_subscription_id;
  NEW.subscription_period_end := OLD.subscription_period_end;
  RETURN NEW;
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
    ),
    'recent_users', (
      SELECT coalesce(jsonb_agg(to_jsonb(u)), '[]'::jsonb)
      FROM (
        SELECT
          username,
          first_name,
          created_at,
          coalesce(pro, false) AS pro,
          coalesce(unlimited, false) AS unlimited,
          coalesce(flashcard_count, 0) AS flashcard_count
        FROM public.profiles
        ORDER BY created_at DESC NULLS LAST
        LIMIT 20
      ) u
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.get_admin_overview()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT coalesce((SELECT admin FROM public.profiles WHERE id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;
  RETURN private.admin_overview();
END;
$$;

REVOKE ALL ON FUNCTION private.admin_overview() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_admin_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_overview() TO authenticated;
