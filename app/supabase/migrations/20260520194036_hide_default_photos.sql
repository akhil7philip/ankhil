-- Admin toggle to hide the 4 pre-wedding default photos in the gallery
ALTER TABLE public.site_config
  ADD COLUMN IF NOT EXISTS hide_default_photos boolean NOT NULL DEFAULT false;
