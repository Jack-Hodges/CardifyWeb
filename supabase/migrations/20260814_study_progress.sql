-- Daily goals, XP, badges, and per-user SRS for Discover / shared decks.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_goal integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS cards_studied_today integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quiz_correct_total integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS badges jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_daily_goal_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_daily_goal_check CHECK (daily_goal >= 5 AND daily_goal <= 200);

CREATE TABLE IF NOT EXISTS public.card_progress (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  flashcard_id bigint NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  srs_ease double precision NOT NULL DEFAULT 2.5,
  srs_interval integer NOT NULL DEFAULT 0,
  srs_repetitions integer NOT NULL DEFAULT 0,
  srs_due_at timestamptz NOT NULL DEFAULT now(),
  srs_last_reviewed_at timestamptz,
  srs_last_quality smallint,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, flashcard_id)
);

CREATE INDEX IF NOT EXISTS card_progress_user_due_idx
  ON public.card_progress (user_id, srs_due_at);

ALTER TABLE public.card_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS card_progress_select_own ON public.card_progress;
DROP POLICY IF EXISTS card_progress_insert_own ON public.card_progress;
DROP POLICY IF EXISTS card_progress_update_own ON public.card_progress;
DROP POLICY IF EXISTS card_progress_delete_own ON public.card_progress;

CREATE POLICY card_progress_select_own
  ON public.card_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY card_progress_insert_own
  ON public.card_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY card_progress_update_own
  ON public.card_progress FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY card_progress_delete_own
  ON public.card_progress FOR DELETE TO authenticated
  USING (user_id = auth.uid());

REVOKE ALL ON TABLE public.card_progress FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.card_progress TO authenticated;

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
  study_minutes_total,
  daily_goal,
  cards_studied_today,
  xp,
  quiz_correct_total,
  badges
) ON TABLE public.profiles TO authenticated;
