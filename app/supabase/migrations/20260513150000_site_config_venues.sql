-- Add editable venue fields to site_config so the couple can update the
-- Kolkata and Kerala (Pala) venue + map URL from /admin without a code change.
-- The EventsSection reads these and renders them on every event card; if a
-- map URL is empty the "View on Maps" link is omitted.

ALTER TABLE public.site_config
  ADD COLUMN IF NOT EXISTS kolkata_venue text DEFAULT 'New Town, Kolkata',
  ADD COLUMN IF NOT EXISTS kolkata_map_url text,
  ADD COLUMN IF NOT EXISTS kerala_venue text DEFAULT 'Pala, Kerala',
  ADD COLUMN IF NOT EXISTS kerala_map_url text;

-- Backfill the singleton row (the row was created before these columns
-- existed, so its values may be NULL even though the DEFAULT is set for
-- future inserts).
UPDATE public.site_config
SET
  kolkata_venue = COALESCE(kolkata_venue, 'New Town, Kolkata'),
  kerala_venue  = COALESCE(kerala_venue,  'Pala, Kerala')
WHERE id = true;
