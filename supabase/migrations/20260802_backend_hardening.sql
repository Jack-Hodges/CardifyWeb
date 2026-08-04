-- Backend hardening: indexes, RPC grants/search_path, RLS initplan, storage listing.
-- No data changes. Behavior for legitimate clients stays the same.

-- ---------------------------------------------------------------------------
-- 1) Indexes for hot filters / unindexed FKs
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS flashcards_subject_active_idx
  ON flashcards (subject_id, sort_order, id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS flashcards_subject_id_idx
  ON flashcards (subject_id);

CREATE INDEX IF NOT EXISTS flashcards_user_id_idx
  ON flashcards (user_id);

CREATE INDEX IF NOT EXISTS subjects_user_active_idx
  ON subjects (user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS subjects_user_id_idx
  ON subjects (user_id);

CREATE INDEX IF NOT EXISTS subjects_collection_id_idx
  ON subjects (collection_id)
  WHERE collection_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS subjects_user_pinned_idx
  ON subjects (user_id, pinned)
  WHERE pinned = true AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS collections_user_id_idx
  ON collections (user_id);

CREATE INDEX IF NOT EXISTS subject_permissions_recipient_email_idx
  ON subject_permissions (recipient_email);

CREATE INDEX IF NOT EXISTS subject_permissions_owner_id_idx
  ON subject_permissions (owner_id);

CREATE INDEX IF NOT EXISTS subject_permissions_subject_id_idx
  ON subject_permissions (subject_id);

CREATE INDEX IF NOT EXISTS public_subject_links_subject_id_idx
  ON public_subject_links (subject_id);

CREATE INDEX IF NOT EXISTS public_subject_links_created_by_idx
  ON public_subject_links (created_by);

CREATE INDEX IF NOT EXISTS share_invites_owner_id_idx
  ON share_invites (owner_id);

CREATE INDEX IF NOT EXISTS share_invites_subject_id_idx
  ON share_invites (subject_id);

CREATE INDEX IF NOT EXISTS study_sessions_subject_id_idx
  ON study_sessions (subject_id);

CREATE INDEX IF NOT EXISTS subject_library_subject_id_idx
  ON subject_library (subject_id);

CREATE INDEX IF NOT EXISTS subject_library_collection_id_idx
  ON subject_library (collection_id);

CREATE INDEX IF NOT EXISTS subject_listings_publisher_id_idx
  ON subject_listings (publisher_id);

-- ---------------------------------------------------------------------------
-- 2) Harden functions: search_path + auth checks on count RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.increment_flashcard_count(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM user_id THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  UPDATE profiles
  SET flashcard_count = coalesce(flashcard_count, 0) + 1
  WHERE id = user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_flashcard_count(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM user_id THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  UPDATE profiles
  SET flashcard_count = greatest(coalesce(flashcard_count, 0) - 1, 0)
  WHERE id = user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_flashcard_count_by(user_id uuid, amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM user_id THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  UPDATE profiles
  SET flashcard_count = greatest(coalesce(flashcard_count, 0) - amount, 0)
  WHERE id = user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_flashcard_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE subjects
    SET flashcard_count = (SELECT COUNT(*) FROM flashcards WHERE subject_id = OLD.subject_id)
    WHERE id = OLD.subject_id;
  ELSE
    UPDATE subjects
    SET flashcard_count = (SELECT COUNT(*) FROM flashcards WHERE subject_id = NEW.subject_id)
    WHERE id = NEW.subject_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.subject_library_collection_owner_check()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.collection_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM collections c
    WHERE c.id = NEW.collection_id
      AND c.user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'collection_id % does not belong to user %', NEW.collection_id, NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Auth-only RPCs: revoke broad execute; keep authenticated (and service_role via bypass)
REVOKE ALL ON FUNCTION public.add_to_library(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_to_library(bigint) FROM anon;
GRANT EXECUTE ON FUNCTION public.add_to_library(bigint) TO authenticated;

REVOKE ALL ON FUNCTION public.increment_flashcard_count(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_flashcard_count(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.increment_flashcard_count(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.decrement_flashcard_count(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decrement_flashcard_count(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.decrement_flashcard_count(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.decrement_flashcard_count_by(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decrement_flashcard_count_by(uuid, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.decrement_flashcard_count_by(uuid, integer) TO authenticated;

-- Public Discover / share-link RPCs stay available to guests
GRANT EXECUTE ON FUNCTION public.list_discover_subjects(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_discover_subject(bigint) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_subject_by_token(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3) RLS: (select auth.uid()) initplan + merge duplicate SELECT policies
-- ---------------------------------------------------------------------------

-- collections
DROP POLICY IF EXISTS "Allow users to manage their own collections" ON collections;
CREATE POLICY "Allow users to manage their own collections" ON collections
  FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- profiles
DROP POLICY IF EXISTS "Allow users to manage their own profile" ON profiles;
CREATE POLICY "Allow users to manage their own profile" ON profiles
  FOR ALL
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- study_sessions
DROP POLICY IF EXISTS study_sessions_own ON study_sessions;
CREATE POLICY study_sessions_own ON study_sessions
  FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- subject_library
DROP POLICY IF EXISTS library_own ON subject_library;
CREATE POLICY library_own ON subject_library
  FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- subject_listings
DROP POLICY IF EXISTS listings_owner ON subject_listings;
CREATE POLICY listings_owner ON subject_listings
  FOR ALL
  USING ((select auth.uid()) = publisher_id)
  WITH CHECK (
    (select auth.uid()) = publisher_id
    AND EXISTS (
      SELECT 1 FROM subjects s
      WHERE s.id = subject_id
        AND s.user_id = (select auth.uid())
        AND s.deleted_at IS NULL
    )
  );

-- public_subject_links
DROP POLICY IF EXISTS public_links_owner ON public_subject_links;
DROP POLICY IF EXISTS public_links_read_active ON public_subject_links;
DROP POLICY IF EXISTS public_links_select ON public_subject_links;
DROP POLICY IF EXISTS public_links_insert ON public_subject_links;
DROP POLICY IF EXISTS public_links_update ON public_subject_links;
DROP POLICY IF EXISTS public_links_delete ON public_subject_links;

CREATE POLICY public_links_select ON public_subject_links
  FOR SELECT
  USING (
    revoked_at IS NULL
    OR created_by = (select auth.uid())
  );

CREATE POLICY public_links_insert ON public_subject_links
  FOR INSERT
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY public_links_update ON public_subject_links
  FOR UPDATE
  USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY public_links_delete ON public_subject_links
  FOR DELETE
  USING (created_by = (select auth.uid()));

-- share_invites
DROP POLICY IF EXISTS share_invites_owner ON share_invites;
DROP POLICY IF EXISTS share_invites_recipient_read ON share_invites;
DROP POLICY IF EXISTS share_invites_recipient_update ON share_invites;
DROP POLICY IF EXISTS share_invites_select ON share_invites;
DROP POLICY IF EXISTS share_invites_insert ON share_invites;
DROP POLICY IF EXISTS share_invites_update ON share_invites;
DROP POLICY IF EXISTS share_invites_delete ON share_invites;

CREATE POLICY share_invites_select ON share_invites
  FOR SELECT
  USING (
    owner_id = (select auth.uid())
    OR lower(recipient_email) = lower((select auth.jwt() ->> 'email'))
  );

CREATE POLICY share_invites_insert ON share_invites
  FOR INSERT
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY share_invites_update ON share_invites
  FOR UPDATE
  USING (
    owner_id = (select auth.uid())
    OR lower(recipient_email) = lower((select auth.jwt() ->> 'email'))
  )
  WITH CHECK (
    owner_id = (select auth.uid())
    OR lower(recipient_email) = lower((select auth.jwt() ->> 'email'))
  );

CREATE POLICY share_invites_delete ON share_invites
  FOR DELETE
  USING (owner_id = (select auth.uid()));

-- subject_permissions
DROP POLICY IF EXISTS "owner can update shares" ON subject_permissions;
CREATE POLICY "owner can update shares" ON subject_permissions
  FOR UPDATE
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

DROP POLICY IF EXISTS share_delete ON subject_permissions;
CREATE POLICY share_delete ON subject_permissions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM subjects s
      WHERE s.id = subject_permissions.subject_id
        AND s.user_id = (select auth.uid())
    )
    OR (recipient_email)::text = (select auth.email())
    OR owner_id = (select auth.uid())
  );

DROP POLICY IF EXISTS share_insert ON subject_permissions;
CREATE POLICY share_insert ON subject_permissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM subjects s
      WHERE s.id = subject_permissions.subject_id
        AND s.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS share_select ON subject_permissions;
CREATE POLICY share_select ON subject_permissions
  FOR SELECT
  USING (
    (recipient_email)::text = (select auth.email())
    OR (select auth.uid()) = owner_id
  );

-- subjects: ownership policies + single merged SELECT
DROP POLICY IF EXISTS "Allow users to delete their own subjects" ON subjects;
CREATE POLICY "Allow users to delete their own subjects" ON subjects
  FOR DELETE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Allow users to insert subjects" ON subjects;
CREATE POLICY "Allow users to insert subjects" ON subjects
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Allow users to update their own subjects" ON subjects;
CREATE POLICY "Allow users to update their own subjects" ON subjects
  FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS subjects_select ON subjects;
DROP POLICY IF EXISTS subjects_library_read ON subjects;
CREATE POLICY subjects_select ON subjects
  FOR SELECT
  USING (
    published = true
    OR user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM subject_permissions sp
      WHERE sp.subject_id = subjects.id
        AND (sp.recipient_email)::text = (select auth.email())
    )
    OR EXISTS (
      SELECT 1 FROM subject_library sl
      WHERE sl.subject_id = subjects.id
        AND sl.user_id = (select auth.uid())
    )
  );

-- flashcards: ownership + single merged SELECT
DROP POLICY IF EXISTS flashcards_delete ON flashcards;
CREATE POLICY flashcards_delete ON flashcards
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM subjects s
      WHERE s.id = flashcards.subject_id
        AND s.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM subject_permissions sp
      WHERE sp.subject_id = flashcards.subject_id
        AND (sp.recipient_email)::text = (select auth.email())
        AND sp.permission = 'editor'
    )
  );

DROP POLICY IF EXISTS flashcards_insert ON flashcards;
CREATE POLICY flashcards_insert ON flashcards
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM subjects s
      WHERE s.id = flashcards.subject_id
        AND s.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM subject_permissions sp
      WHERE sp.subject_id = flashcards.subject_id
        AND (sp.recipient_email)::text = (select auth.email())
        AND sp.permission = 'editor'
    )
  );

DROP POLICY IF EXISTS flashcards_update ON flashcards;
CREATE POLICY flashcards_update ON flashcards
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM subjects s
      WHERE s.id = flashcards.subject_id
        AND s.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM subject_permissions sp
      WHERE sp.subject_id = flashcards.subject_id
        AND (sp.recipient_email)::text = (select auth.email())
        AND sp.permission = 'editor'
    )
  );

DROP POLICY IF EXISTS flashcards_select ON flashcards;
DROP POLICY IF EXISTS flashcards_library_read ON flashcards;
CREATE POLICY flashcards_select ON flashcards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subjects s
      WHERE s.id = flashcards.subject_id
        AND s.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM subject_permissions sp
      WHERE sp.subject_id = flashcards.subject_id
        AND (sp.recipient_email)::text = (select auth.email())
    )
    OR EXISTS (
      SELECT 1 FROM subjects s
      WHERE s.id = flashcards.subject_id
        AND s.published = true
    )
    OR (
      deleted_at IS NULL
      AND EXISTS (
        SELECT 1 FROM subject_library sl
        WHERE sl.subject_id = flashcards.subject_id
          AND sl.user_id = (select auth.uid())
      )
    )
  );

-- card_srs (if present)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'card_srs' AND policyname = 'card_srs_own'
  ) THEN
    EXECUTE $p$
      DROP POLICY card_srs_own ON card_srs;
      CREATE POLICY card_srs_own ON card_srs
        FOR ALL
        USING ((select auth.uid()) = user_id)
        WITH CHECK ((select auth.uid()) = user_id);
    $p$;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4) Storage: stop public listing of ProfilePictures (public URLs still work)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS profile_pictures_select ON storage.objects;
-- Owners can still read their own objects via the Storage API when signed in
CREATE POLICY profile_pictures_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'ProfilePictures'
    AND (select auth.uid())::text = (string_to_array(name, '/'))[1]
  );

DROP POLICY IF EXISTS profile_pictures_insert ON storage.objects;
CREATE POLICY profile_pictures_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'ProfilePictures'
    AND (select auth.uid())::text = (string_to_array(name, '/'))[1]
  );

DROP POLICY IF EXISTS profile_pictures_update ON storage.objects;
CREATE POLICY profile_pictures_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'ProfilePictures'
    AND (select auth.uid())::text = (string_to_array(name, '/'))[1]
  )
  WITH CHECK (
    bucket_id = 'ProfilePictures'
    AND (select auth.uid())::text = (string_to_array(name, '/'))[1]
  );

DROP POLICY IF EXISTS profile_pictures_delete ON storage.objects;
CREATE POLICY profile_pictures_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'ProfilePictures'
    AND (select auth.uid())::text = (string_to_array(name, '/'))[1]
  );

-- FlashcardImages storage policies (initplan)
DROP POLICY IF EXISTS "Users can manage their own flashcards idbfqw_0" ON storage.objects;
CREATE POLICY "Users can manage their own flashcards idbfqw_0" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'FlashcardImages' AND (select auth.uid()) = owner);

DROP POLICY IF EXISTS "Users can manage their own flashcards idbfqw_1" ON storage.objects;
CREATE POLICY "Users can manage their own flashcards idbfqw_1" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'FlashcardImages' AND (select auth.uid()) = owner);

DROP POLICY IF EXISTS "Users can manage their own flashcards idbfqw_2" ON storage.objects;
CREATE POLICY "Users can manage their own flashcards idbfqw_2" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'FlashcardImages' AND (select auth.uid()) = owner);
