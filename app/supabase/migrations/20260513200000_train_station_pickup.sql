-- Train station pickup support.
--   * site_config gains two text fields for the configured nearest station
--     (editable from /admin).
--   * rsvps gains two boolean columns mirroring kolkata_airport_pickup /
--     kerala_airport_pickup so guests can request a train-station pickup
--     independently of the airport one.
--   * update_rsvp_by_token RPC is refreshed (CREATE OR REPLACE) to know
--     about the two new fields. Without this, edits via /rsvp/edit/<token>
--     would silently drop the train pickup values.

-- ---------------------------------------------------------------------------
-- site_config: nearest railway station per city (defaults documented inline)
-- ---------------------------------------------------------------------------
ALTER TABLE public.site_config
  ADD COLUMN IF NOT EXISTS kolkata_railway_station text DEFAULT 'Sealdah Railway Station',
  ADD COLUMN IF NOT EXISTS kerala_railway_station text DEFAULT 'Kottayam Railway Station';

UPDATE public.site_config
SET
  kolkata_railway_station = COALESCE(kolkata_railway_station, 'Sealdah Railway Station'),
  kerala_railway_station  = COALESCE(kerala_railway_station,  'Kottayam Railway Station')
WHERE id = true;

-- ---------------------------------------------------------------------------
-- rsvps: per-city train pickup flag (NULL = not asked / not attending)
-- ---------------------------------------------------------------------------
ALTER TABLE public.rsvps
  ADD COLUMN IF NOT EXISTS kolkata_train_pickup boolean,
  ADD COLUMN IF NOT EXISTS kerala_train_pickup boolean;

-- ---------------------------------------------------------------------------
-- Refreshed update_rsvp_by_token RPC — adds kolkata_train_pickup and
-- kerala_train_pickup to the JSONB-driven UPDATE. Everything else mirrors
-- the original definition in 20260511000000_rsvp_edit_token.sql.
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
    kolkata_train_pickup   = CASE
      WHEN p_payload ? 'kolkata_train_pickup'
        THEN NULLIF(p_payload->>'kolkata_train_pickup', '')::boolean
      ELSE kolkata_train_pickup
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
    kerala_train_pickup    = CASE
      WHEN p_payload ? 'kerala_train_pickup'
        THEN NULLIF(p_payload->>'kerala_train_pickup', '')::boolean
      ELSE kerala_train_pickup
    END,
    special_notes          = NULLIF(p_payload->>'special_notes', '')
  WHERE edit_token = p_token
  RETURNING *;
END;
$$;

REVOKE ALL ON FUNCTION public.update_rsvp_by_token(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_rsvp_by_token(uuid, jsonb) TO anon, authenticated;
