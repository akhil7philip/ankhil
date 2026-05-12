-- Site-wide config singleton + RSVP open/close enforcement.
--
-- One-row table holding boolean toggles. The single-row invariant is
-- enforced by a CHECK constraint on a fixed boolean primary key.
--
-- Trust model: anon can SELECT (the public RSVP page reads the flag)
-- and UPDATE (the existing /admin UI flips the toggle using the anon
-- key behind a client-side password gate). This is the same model the
-- existing /admin already uses for reading rsvps. Tighten later if you
-- move admin to a real auth backend.

CREATE TABLE IF NOT EXISTS public.site_config (
  id boolean PRIMARY KEY DEFAULT true,
  rsvp_open boolean NOT NULL DEFAULT true,
  rsvp_closed_message text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_config_singleton CHECK (id = true)
);

INSERT INTO public.site_config (id, rsvp_open)
VALUES (true, true)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_config_anon_select ON public.site_config;
CREATE POLICY site_config_anon_select ON public.site_config
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS site_config_anon_update ON public.site_config;
CREATE POLICY site_config_anon_update ON public.site_config
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Keep updated_at fresh on every UPDATE.
CREATE OR REPLACE FUNCTION public.site_config_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS site_config_touch_updated_at ON public.site_config;
CREATE TRIGGER site_config_touch_updated_at
BEFORE UPDATE ON public.site_config
FOR EACH ROW EXECUTE FUNCTION public.site_config_touch_updated_at();

-- Server-side enforcement: refuse new INSERTs to rsvps when closed.
-- This is the belt to the client-side suspenders -- even a direct REST
-- call to the Supabase API will be rejected when rsvp_open is false.
-- Edits via update_rsvp_by_token (SECURITY DEFINER, UPDATE only) are
-- unaffected -- this trigger only fires on INSERT.
CREATE OR REPLACE FUNCTION public.rsvps_check_open()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  is_open boolean;
BEGIN
  SELECT rsvp_open INTO is_open FROM public.site_config WHERE id = true;
  IF is_open IS FALSE THEN
    RAISE EXCEPTION 'RSVPs are currently closed' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rsvps_check_open ON public.rsvps;
CREATE TRIGGER rsvps_check_open
BEFORE INSERT ON public.rsvps
FOR EACH ROW EXECUTE FUNCTION public.rsvps_check_open();
