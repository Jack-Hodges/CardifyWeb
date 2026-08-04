-- Per-user overrides for Discover library subjects (color, collection, pin).
-- Content stays on the publisher's subjects row; prefs live on membership.

ALTER TABLE subject_library
  ADD COLUMN IF NOT EXISTS colour_text text,
  ADD COLUMN IF NOT EXISTS colour_intensity smallint,
  ADD COLUMN IF NOT EXISTS collection_id bigint REFERENCES collections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pinned boolean;

CREATE INDEX IF NOT EXISTS subject_library_collection_idx
  ON subject_library (user_id, collection_id)
  WHERE collection_id IS NOT NULL;

-- Ensure collection_id always belongs to the same user as the library row.
CREATE OR REPLACE FUNCTION subject_library_collection_owner_check()
RETURNS trigger
LANGUAGE plpgsql
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

DROP TRIGGER IF EXISTS subject_library_collection_owner ON subject_library;
CREATE TRIGGER subject_library_collection_owner
  BEFORE INSERT OR UPDATE OF collection_id, user_id ON subject_library
  FOR EACH ROW
  EXECUTE FUNCTION subject_library_collection_owner_check();
