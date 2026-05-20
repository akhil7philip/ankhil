-- Fix missing DELETE policies that caused photos to reappear after admin delete.

-- Allow anon to delete from photos table (admin uses anon key)
DROP POLICY IF EXISTS photos_public_delete ON public.photos;
CREATE POLICY photos_public_delete ON public.photos
  FOR DELETE TO anon, authenticated
  USING (true);

-- Allow anon to delete from storage too (admin uses anon key)
DROP POLICY IF EXISTS wedding_photos_auth_delete ON storage.objects;
CREATE POLICY wedding_photos_anon_delete ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'wedding-photos');
