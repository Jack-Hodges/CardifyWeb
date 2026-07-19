-- Store SM-2 on flashcards instead of a separate card_srs table
ALTER TABLE flashcards
  ADD COLUMN IF NOT EXISTS srs_ease double precision NOT NULL DEFAULT 2.5,
  ADD COLUMN IF NOT EXISTS srs_interval integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS srs_repetitions integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS srs_due_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS srs_last_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS srs_last_quality smallint;

-- Copy any existing per-user SRS onto the card (owner's latest row wins)
UPDATE flashcards f
SET
  srs_ease = c.ease,
  srs_interval = c.interval,
  srs_repetitions = c.repetitions,
  srs_due_at = c.due_at,
  srs_last_reviewed_at = c.last_reviewed_at,
  srs_last_quality = c.last_quality
FROM card_srs c
WHERE c.card_id = f.id
  AND c.user_id = f.user_id;

CREATE INDEX IF NOT EXISTS flashcards_srs_due_idx
  ON flashcards (user_id, srs_due_at)
  WHERE deleted_at IS NULL;

-- SRS now lives on flashcards; retire the separate table
DROP TABLE IF EXISTS card_srs CASCADE;
