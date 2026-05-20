-- Allow photo_upload_code to be null (no code required = open upload)
ALTER TABLE public.site_config ALTER COLUMN photo_upload_code DROP NOT NULL;
