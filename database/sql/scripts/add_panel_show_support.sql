-- Panel show support: show format, segment timestamps, panel cast roles.
-- Apply before deploying. Existing shows default to 'Sketch'; existing
-- sketches have no start/end time and play from the start of the video.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'show_format_type') THEN
    CREATE TYPE public.show_format_type AS ENUM ('Sketch', 'Panel');
  END IF;
END
$$;

ALTER TABLE public.show
  ADD COLUMN IF NOT EXISTS format public.show_format_type NOT NULL DEFAULT 'Sketch';

-- Seconds from the start of the video file. Both optional; end may be set
-- without start (plays from 0) and start without end (plays to the end).
ALTER TABLE public.sketch
  ADD COLUMN IF NOT EXISTS start_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS end_seconds INTEGER;

ALTER TABLE public.sketch
  DROP CONSTRAINT IF EXISTS sketch_segment_times_check;
ALTER TABLE public.sketch
  ADD CONSTRAINT sketch_segment_times_check CHECK (
    (start_seconds IS NULL OR start_seconds >= 0)
    AND (end_seconds IS NULL OR end_seconds > 0)
    AND (start_seconds IS NULL OR end_seconds IS NULL OR end_seconds > start_seconds)
  );

ALTER TYPE public.cast_role_type ADD VALUE IF NOT EXISTS 'Captain';
ALTER TYPE public.cast_role_type ADD VALUE IF NOT EXISTS 'Panellist';
