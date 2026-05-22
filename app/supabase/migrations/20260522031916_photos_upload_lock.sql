-- Server-side enforcement: block photo uploads when photo_upload_enabled is false.
CREATE OR REPLACE FUNCTION public.photos_check_upload_open()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  is_open boolean;
BEGIN
  SELECT photo_upload_enabled INTO is_open FROM public.site_config WHERE id = true;
  IF is_open IS FALSE THEN
    RAISE EXCEPTION 'Photo uploads are currently closed' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS photos_check_upload_open ON public.photos;
CREATE TRIGGER photos_check_upload_open
BEFORE INSERT ON public.photos
FOR EACH ROW EXECUTE FUNCTION public.photos_check_upload_open();
