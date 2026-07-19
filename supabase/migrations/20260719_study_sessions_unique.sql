-- One study session row per user + subject + mode (latest session overwrites)
-- Dedupe existing rows first, keeping the most recently started

DELETE FROM study_sessions a
USING study_sessions b
WHERE a.user_id = b.user_id
  AND a.subject_id IS NOT DISTINCT FROM b.subject_id
  AND a.mode = b.mode
  AND a.id < b.id;

CREATE UNIQUE INDEX IF NOT EXISTS study_sessions_user_subject_mode_uidx
  ON study_sessions (user_id, subject_id, mode);
