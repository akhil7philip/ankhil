-- Multi-station support per city.
--
-- Replaces the single kolkata_railway_station / kerala_railway_station text
-- field with text arrays so /admin can list multiple options (e.g. Sealdah
-- + Howrah for Kolkata). When a guest opts in to train station pickup, the
-- RSVP form shows a dropdown of these options; the chosen one is recorded
-- per RSVP.
--
-- The old singular columns are LEFT IN PLACE (no production data depends
-- on them at this point, but dropping is irreversible — kept around as a
-- safety net; the application no longer reads them).

-- ---------------------------------------------------------------------------
-- site_config: arrays of station names
-- ---------------------------------------------------------------------------
ALTER TABLE public.site_config
  ADD COLUMN IF NOT EXISTS kolkata_railway_stations text[]
    NOT NULL DEFAULT ARRAY['Sealdah Railway Station', 'Howrah Railway Station'],
  ADD COLUMN IF NOT EXISTS kerala_railway_stations text[]
    NOT NULL DEFAULT ARRAY['Kottayam Railway Station'];

-- If the operator had customised the legacy singular column to a value not
-- already in the new default array, fold it in so a hand-edited station
-- isn't silently dropped.
UPDATE public.site_config
SET kolkata_railway_stations = CASE
      WHEN kolkata_railway_station IS NOT NULL
        AND kolkata_railway_station <> ''
        AND NOT (kolkata_railway_station = ANY(kolkata_railway_stations))
      THEN array_append(kolkata_railway_stations, kolkata_railway_station)
      ELSE kolkata_railway_stations
    END,
    kerala_railway_stations = CASE
      WHEN kerala_railway_station IS NOT NULL
        AND kerala_railway_station <> ''
        AND NOT (kerala_railway_station = ANY(kerala_railway_stations))
      THEN array_append(kerala_railway_stations, kerala_railway_station)
      ELSE kerala_railway_stations
    END
WHERE id = true;

-- ---------------------------------------------------------------------------
-- rsvps: which station the guest selected (NULL when no train pickup needed)
-- ---------------------------------------------------------------------------
ALTER TABLE public.rsvps
  ADD COLUMN IF NOT EXISTS kolkata_train_pickup_station text,
  ADD COLUMN IF NOT EXISTS kerala_train_pickup_station text;

-- ---------------------------------------------------------------------------
-- Refreshed update_rsvp_by_token RPC — adds the two new station fields.
-- Everything else mirrors the previous definition.
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
    kolkata_train_pickup_station = CASE
      WHEN p_payload ? 'kolkata_train_pickup_station'
        THEN NULLIF(p_payload->>'kolkata_train_pickup_station', '')
      ELSE kolkata_train_pickup_station
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
    kerala_train_pickup_station = CASE
      WHEN p_payload ? 'kerala_train_pickup_station'
        THEN NULLIF(p_payload->>'kerala_train_pickup_station', '')
      ELSE kerala_train_pickup_station
    END,
    special_notes          = NULLIF(p_payload->>'special_notes', '')
  WHERE edit_token = p_token
  RETURNING *;
END;
$$;

REVOKE ALL ON FUNCTION public.update_rsvp_by_token(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_rsvp_by_token(uuid, jsonb) TO anon, authenticated;
