ALTER TABLE public.site_config
  ADD COLUMN IF NOT EXISTS hidden_events text[] NOT NULL DEFAULT ARRAY['mehendi'];
