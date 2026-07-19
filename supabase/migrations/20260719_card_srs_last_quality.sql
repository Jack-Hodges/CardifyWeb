-- Track last SM-2 grade for session filters (New / Again / Hard / Good / Easy)
ALTER TABLE card_srs
  ADD COLUMN IF NOT EXISTS last_quality smallint;

CREATE INDEX IF NOT EXISTS card_srs_user_last_quality_idx
  ON card_srs (user_id, last_quality);
