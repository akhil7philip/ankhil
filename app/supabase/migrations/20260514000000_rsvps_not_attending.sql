-- Allow guests to RSVP with regrets — i.e. record that they can't make it.
-- Previously the form rejected submissions with zero celebrations selected.
-- A new column captures the explicit not-attending state, and the
-- update_rsvp_by_token RPC is refreshed to persist it on edit.

ALTER TABLE public.rsvps
  ADD COLUMN IF NOT EXISTS not_attending boolean NOT NULL DEFAULT false;

-- Refresh update_rsvp_by_token to handle not_attending. Body matches the
-- previous version with the new field appended.
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
    phone                  = NULLIF(p_payload->>'phone', ''),
    email                  = NULLIF(p_payload->>'email', ''),
    dietary                = COALESCE(NULLIF(p_payload->>'dietary', ''), dietary),
    guest_count            = COALESCE((p_payload->>'guest_count')::int, guest_count),
    not_attending          = COALESCE((p_payload->>'not_attending')::boolean, not_attending),
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
