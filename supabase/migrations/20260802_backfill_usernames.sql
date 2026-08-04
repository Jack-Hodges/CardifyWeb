-- Backfill unique usernames for existing profiles (from first_name when possible)

DO $$
DECLARE
  r record;
  stem text;
  candidate text;
  suffix int;
BEGIN
  FOR r IN
    SELECT id, first_name
    FROM profiles
    WHERE username IS NULL
    ORDER BY created_at NULLS LAST, id
  LOOP
    stem := lower(coalesce(nullif(trim(r.first_name), ''), 'user'));
    stem := regexp_replace(stem, '[^a-z0-9]+', '_', 'g');
    stem := trim(both '_' from stem);
    stem := regexp_replace(stem, '_+', '_', 'g');

    IF stem IS NULL OR stem = '' OR length(stem) < 3 THEN
      stem := 'user';
    END IF;

    stem := left(stem, 16);
    candidate := stem;
    suffix := 1;

    WHILE EXISTS (
      SELECT 1 FROM profiles p WHERE lower(p.username) = lower(candidate)
    ) LOOP
      suffix := suffix + 1;
      candidate := left(stem, 16) || suffix::text;
      candidate := left(candidate, 20);
    END LOOP;

    -- Ensure format still valid after suffixing
    IF candidate !~ '^[a-z0-9_]{3,20}$' THEN
      candidate := 'user' || substr(replace(r.id::text, '-', ''), 1, 8);
    END IF;

    WHILE EXISTS (
      SELECT 1 FROM profiles p WHERE lower(p.username) = lower(candidate)
    ) LOOP
      suffix := suffix + 1;
      candidate := 'user' || suffix::text;
    END LOOP;

    UPDATE profiles SET username = candidate WHERE id = r.id;
  END LOOP;
END $$;
