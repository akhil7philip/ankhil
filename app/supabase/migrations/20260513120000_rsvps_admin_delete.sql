-- Allow anon DELETE on public.rsvps so the /admin UI can delete entries.
--
-- Trust model: same as existing /admin SELECT access -- the admin UI is gated
-- by a client-side password stored in sessionStorage. The Supabase anon key is
-- visible in the deployed bundle, so this policy is effectively "anyone who
-- reads the bundle can delete RSVPs." Acceptable for a small wedding site
-- where the audience is known; tighten later by moving the admin password
-- server-side and routing deletes through a SECURITY DEFINER RPC.

DROP POLICY IF EXISTS rsvps_anon_delete ON public.rsvps;
CREATE POLICY rsvps_anon_delete ON public.rsvps
  FOR DELETE TO anon, authenticated
  USING (true);
