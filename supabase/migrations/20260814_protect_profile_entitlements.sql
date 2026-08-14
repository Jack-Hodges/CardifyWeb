-- Lock entitlement columns on profiles, keep flashcard_count in sync from
-- flashcards, and enforce card limits against live rows (not the denormalized count).

-- ---------------------------------------------------------------------------
-- 1) Private schema for SECURITY DEFINER helpers
-- ---------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;
GRANT USAGE ON SCHEMA private TO postgres, service_role;

-- ---------------------------------------------------------------------------
-- 2) Keep profiles.flashcard_count aligned with live flashcards
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.sync_profile_flashcard_count_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles p
  SET flashcard_count = GREATEST(0, coalesce(p.flashcard_count, 0) + d.delta)::smallint
  FROM (
    SELECT user_id, COUNT(*)::integer AS delta
    FROM new_rows
    WHERE deleted_at IS NULL
      AND user_id IS NOT NULL
    GROUP BY user_id
  ) d
  WHERE p.id = d.user_id;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION private.sync_profile_flashcard_count_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles p
  SET flashcard_count = GREATEST(0, coalesce(p.flashcard_count, 0) - d.delta)::smallint
  FROM (
    SELECT user_id, COUNT(*)::integer AS delta
    FROM old_rows
    WHERE deleted_at IS NULL
      AND user_id IS NOT NULL
    GROUP BY user_id
  ) d
  WHERE p.id = d.user_id;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION private.sync_profile_flashcard_count_update_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.deleted_at IS NULL AND OLD.user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET flashcard_count = GREATEST(0, coalesce(flashcard_count, 0) - 1)::smallint
    WHERE id = OLD.user_id;
  END IF;

  IF NEW.deleted_at IS NULL AND NEW.user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET flashcard_count = GREATEST(0, coalesce(flashcard_count, 0) + 1)::smallint
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS flashcards_sync_profile_count_insert ON public.flashcards;
CREATE TRIGGER flashcards_sync_profile_count_insert
  AFTER INSERT ON public.flashcards
  REFERENCING NEW TABLE AS new_rows
  FOR EACH STATEMENT
  EXECUTE FUNCTION private.sync_profile_flashcard_count_insert();

DROP TRIGGER IF EXISTS flashcards_sync_profile_count_delete ON public.flashcards;
CREATE TRIGGER flashcards_sync_profile_count_delete
  AFTER DELETE ON public.flashcards
  REFERENCING OLD TABLE AS old_rows
  FOR EACH STATEMENT
  EXECUTE FUNCTION private.sync_profile_flashcard_count_delete();

DROP TRIGGER IF EXISTS flashcards_sync_profile_count_update ON public.flashcards;
CREATE TRIGGER flashcards_sync_profile_count_update
  AFTER UPDATE ON public.flashcards
  FOR EACH ROW
  WHEN (
    OLD.deleted_at IS DISTINCT FROM NEW.deleted_at
    OR OLD.user_id IS DISTINCT FROM NEW.user_id
  )
  EXECUTE FUNCTION private.sync_profile_flashcard_count_update_row();

CREATE INDEX IF NOT EXISTS flashcards_user_live_idx
  ON public.flashcards (user_id)
  WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- 3) Enforce 100 / 500 card cap against live rows
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.assert_user_within_flashcard_quota(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  live_count integer;
  max_cards integer;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT
    CASE
      WHEN coalesce(unlimited, false) OR coalesce(pro, false) THEN 500
      ELSE 100
    END
  INTO max_cards
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF max_cards IS NULL THEN
    RETURN;
  END IF;

  SELECT COUNT(*)::integer
  INTO live_count
  FROM public.flashcards
  WHERE user_id = p_user_id
    AND deleted_at IS NULL;

  IF live_count > max_cards THEN
    RAISE EXCEPTION 'You''ve reached your card limit of % cards.', max_cards
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION private.enforce_flashcard_quota_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT DISTINCT user_id
    FROM new_rows
    WHERE user_id IS NOT NULL
      AND deleted_at IS NULL
  LOOP
    PERFORM private.assert_user_within_flashcard_quota(rec.user_id);
  END LOOP;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION private.enforce_flashcard_quota_update_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM private.assert_user_within_flashcard_quota(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS flashcards_enforce_quota ON public.flashcards;
DROP TRIGGER IF EXISTS flashcards_enforce_quota_insert ON public.flashcards;
CREATE TRIGGER flashcards_enforce_quota_insert
  AFTER INSERT ON public.flashcards
  REFERENCING NEW TABLE AS new_rows
  FOR EACH STATEMENT
  EXECUTE FUNCTION private.enforce_flashcard_quota_insert();

DROP TRIGGER IF EXISTS flashcards_enforce_quota_update ON public.flashcards;
CREATE TRIGGER flashcards_enforce_quota_update
  AFTER UPDATE ON public.flashcards
  FOR EACH ROW
  WHEN (
    NEW.deleted_at IS NULL
    AND (
      OLD.deleted_at IS DISTINCT FROM NEW.deleted_at
      OR OLD.user_id IS DISTINCT FROM NEW.user_id
    )
  )
  EXECUTE FUNCTION private.enforce_flashcard_quota_update_row();

REVOKE ALL ON FUNCTION private.sync_profile_flashcard_count_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.sync_profile_flashcard_count_delete() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.sync_profile_flashcard_count_update_row() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.assert_user_within_flashcard_quota(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.enforce_flashcard_quota_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.enforce_flashcard_quota_update_row() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4) Users cannot change entitlement / billing / quota columns
-- ---------------------------------------------------------------------------

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
    NEW.flashcard_count := 0;
    NEW.generation_count := 0;
    NEW.stripe_customer_id := NULL;
    NEW.stripe_subscription_id := NULL;
    NEW.subscription_period_end := NULL;
    RETURN NEW;
  END IF;

  NEW.pro := OLD.pro;
  NEW.unlimited := OLD.unlimited;
  NEW.flashcard_count := OLD.flashcard_count;
  NEW.generation_count := OLD.generation_count;
  NEW.stripe_customer_id := OLD.stripe_customer_id;
  NEW.stripe_subscription_id := OLD.stripe_subscription_id;
  NEW.subscription_period_end := OLD.subscription_period_end;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_entitlements ON public.profiles;
CREATE TRIGGER profiles_protect_entitlements
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_entitlements();

REVOKE INSERT, UPDATE, TRUNCATE ON TABLE public.profiles FROM anon;
REVOKE INSERT, UPDATE ON TABLE public.profiles FROM authenticated;

GRANT INSERT (
  id,
  first_name,
  avatar_url,
  "frontAlign",
  "backAlign",
  theme,
  popup_states,
  sort_preference,
  card_art,
  tutorial_subject,
  username
) ON TABLE public.profiles TO authenticated;

GRANT UPDATE (
  first_name,
  avatar_url,
  "frontAlign",
  "backAlign",
  theme,
  popup_states,
  sort_preference,
  card_art,
  tutorial_subject,
  username,
  streak_current,
  streak_best,
  last_study_date,
  study_minutes_total
) ON TABLE public.profiles TO authenticated;

-- ---------------------------------------------------------------------------
-- 5) Count RPCs become no-ops and are no longer client-callable
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.increment_flashcard_count(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_flashcard_count(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_flashcard_count_by(user_id uuid, amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_flashcard_count_by(user_id uuid, amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_flashcard_count(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.decrement_flashcard_count(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.decrement_flashcard_count_by(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_flashcard_count_by(uuid, integer) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6) Repair drifted counters
-- ---------------------------------------------------------------------------

UPDATE public.profiles p
SET flashcard_count = sub.cnt
FROM (
  SELECT user_id, LEAST(COUNT(*), 32767)::smallint AS cnt
  FROM public.flashcards
  WHERE deleted_at IS NULL
    AND user_id IS NOT NULL
  GROUP BY user_id
) sub
WHERE p.id = sub.user_id;

UPDATE public.profiles p
SET flashcard_count = 0
WHERE NOT EXISTS (
  SELECT 1
  FROM public.flashcards f
  WHERE f.user_id = p.id
    AND f.deleted_at IS NULL
);
