-- Kerala reception veg / non-veg toggle. Default false (veg-only everywhere).
-- When true:
--   * RSVP form shows a dietary radio inside the Kerala details panel
--     when the guest is attending Kerala
--   * FAQ "What food will be served?" answer flips to mention Kerala has
--     both options
ALTER TABLE public.site_config
  ADD COLUMN IF NOT EXISTS kerala_non_veg boolean NOT NULL DEFAULT false;
