-- RSVP edit-by-token: adds a per-row UUID token and SECURITY DEFINER RPCs
-- so anonymous clients can fetch and update their own RSVP without seeing
-- anyone else's row. Knowing the token is the only authorisation needed —
-- a v4 UUID has ~122 bits of entropy, so the URL is effectively unguessable.

-- Required for gen_random_uuid(). Supabase enables this by default, but
-- include it defensively.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.rsvps
  ADD COLUMN IF NOT EXISTS edit_token uuid NOT NULL DEFAULT gen_random_uuid();

ALTER TABLE public.rsvps
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS rsvps_edit_token_idx
  ON public.rsvps (edit_token);

-- Keep updated_at fresh on every UPDATE.
CREATE OR REPLACE FUNCTION public.rsvps_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rsvps_touch_updated_at ON public.rsvps;
CREATE TRIGGER rsvps_touch_updated_at
BEFORE UPDATE ON public.rsvps
FOR EACH ROW EXECUTE FUNCTION public.rsvps_touch_updated_at();

-- ---------------------------------------------------------------------------
-- RPC: read one RSVP by its edit token (for the /rsvp/edit/:token page)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_rsvp_by_token(p_token uuid)
RETURNS SETOF public.rsvps
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT * FROM public.rsvps WHERE edit_token = p_token LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_rsvp_by_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_rsvp_by_token(uuid) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- RPC: update an RSVP by token. JSONB payload mirrors the insert shape.
-- Returns the updated row (or empty set if token didn't match anything).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_rsvp_by_token(
  p_token   uuid,
  p_payload jsonb
)
RETURNS SETOF public.rsvps
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.rsvps SET
    full_name              = COALESCE(NULLIF(p_payload->>'full_name', ''), full_name),
    phone                  = COALESCE(NULLIF(p_payload->>'phone', ''), phone),
    email                  = NULLIF(p_payload->>'email', ''),
    dietary                = COALESCE(NULLIF(p_payload->>'dietary', ''), dietary),
    guest_count            = COALESCE((p_payload->>'guest_count')::int, guest_count),
    attending_kolkata      = COALESCE((p_payload->>'attending_kolkata')::boolean, attending_kolkata),
    kolkata_events         = CASE
      WHEN p_payload ? 'kolkata_events' AND jsonb_typeof(p_payload->'kolkata_events') = 'array'
        THEN ARRAY(SELECT jsonb_array_elements_text(p_payload->'kolkata_events'))
      WHEN p_payload ? 'kolkata_events' AND p_payload->>'kolkata_events' IS NULL
        THEN NULL
      ELSE kolkata_events
    END,
    kolkata_arrival        = CASE
      WHEN p_payload ? 'kolkata_arrival'
        THEN NULLIF(p_payload->>'kolkata_arrival', '')::timestamptz
      ELSE kolkata_arrival
    END,
    kolkata_departure      = CASE
      WHEN p_payload ? 'kolkata_departure'
        THEN NULLIF(p_payload->>'kolkata_departure', '')::timestamptz
      ELSE kolkata_departure
    END,
    kolkata_accommodation  = CASE
      WHEN p_payload ? 'kolkata_accommodation'
        THEN NULLIF(p_payload->>'kolkata_accommodation', '')::boolean
      ELSE kolkata_accommodation
    END,
    kolkata_airport_pickup = CASE
      WHEN p_payload ? 'kolkata_airport_pickup'
        THEN NULLIF(p_payload->>'kolkata_airport_pickup', '')::boolean
      ELSE kolkata_airport_pickup
    END,
    attending_kerala       = COALESCE((p_payload->>'attending_kerala')::boolean, attending_kerala),
    kerala_arrival         = CASE
      WHEN p_payload ? 'kerala_arrival'
        THEN NULLIF(p_payload->>'kerala_arrival', '')::timestamptz
      ELSE kerala_arrival
    END,
    kerala_departure       = CASE
      WHEN p_payload ? 'kerala_departure'
        THEN NULLIF(p_payload->>'kerala_departure', '')::timestamptz
      ELSE kerala_departure
    END,
    kerala_accommodation   = CASE
      WHEN p_payload ? 'kerala_accommodation'
        THEN NULLIF(p_payload->>'kerala_accommodation', '')::boolean
      ELSE kerala_accommodation
    END,
    kerala_airport_pickup  = CASE
      WHEN p_payload ? 'kerala_airport_pickup'
        THEN NULLIF(p_payload->>'kerala_airport_pickup', '')::boolean
      ELSE kerala_airport_pickup
    END,
    special_notes          = NULLIF(p_payload->>'special_notes', '')
  WHERE edit_token = p_token
  RETURNING *;
END;
$$;

REVOKE ALL ON FUNCTION public.update_rsvp_by_token(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_rsvp_by_token(uuid, jsonb) TO anon, authenticated;
