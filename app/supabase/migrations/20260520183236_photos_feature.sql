-- Guest photo upload, moderation, face tagging, reporting, and live gallery.

-- ---------------------------------------------------------------------------
-- Storage bucket
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('wedding-photos', 'wedding-photos', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: anon can upload photos
DROP POLICY IF EXISTS wedding_photos_anon_insert ON storage.objects;
CREATE POLICY wedding_photos_anon_insert ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'wedding-photos');

-- Storage RLS: anon can read (public bucket, visibility controlled by app)
DROP POLICY IF EXISTS wedding_photos_anon_select ON storage.objects;
CREATE POLICY wedding_photos_anon_select ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'wedding-photos');

-- Storage RLS: anon can delete (admin page uses anon key)
DROP POLICY IF EXISTS wedding_photos_auth_delete ON storage.objects;
CREATE POLICY wedding_photos_anon_delete ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'wedding-photos');

-- ---------------------------------------------------------------------------
-- Photos table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.photos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),

  -- Storage
  storage_path    text NOT NULL,
  thumbnail_path  text,
  filename        text NOT NULL,
  file_size       int,
  width           int,
  height          int,
  mime_type       text,

  -- Auto-captured metadata
  exif_date       timestamptz,
  device_make     text,
  device_model    text,
  uploader_ip     inet,

  -- Face detection tracking
  face_detection_done boolean NOT NULL DEFAULT false,

  -- Moderation (strict — every photo manually approved)
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected')),
  reviewed_at     timestamptz,

  -- Visibility embargo
  visible_from    timestamptz,

  -- Engagement
  likes_count     int NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_photos_status ON public.photos(status);
CREATE INDEX IF NOT EXISTS idx_photos_created ON public.photos(created_at);
CREATE INDEX IF NOT EXISTS idx_photos_reviewed ON public.photos(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_photos_face_detection ON public.photos(face_detection_done);

-- RLS: public can read all photos (app filters what's shown; admin needs pending/rejected)
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS photos_public_select ON public.photos;
CREATE POLICY photos_public_select ON public.photos
  FOR SELECT TO anon, authenticated
  USING (true);

-- RLS: anyone can upload (insert)
DROP POLICY IF EXISTS photos_public_insert ON public.photos;
CREATE POLICY photos_public_insert ON public.photos
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- RLS: allow updates (admin status changes, likes, face_detection_done)
DROP POLICY IF EXISTS photos_public_update ON public.photos;
CREATE POLICY photos_public_update ON public.photos
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- RLS: allow deletes (admin deletion)
DROP POLICY IF EXISTS photos_public_delete ON public.photos;
CREATE POLICY photos_public_delete ON public.photos
  FOR DELETE TO anon, authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- Face tags table (unnamed faces supported — person_name is nullable)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.face_tags (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),

  photo_id        uuid NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,

  -- Person identity (NULL = detected but not yet named by admin)
  person_name     text,
  person_slug     text,

  -- Bounding box (percentage 0.0–1.0)
  x               float NOT NULL,
  y               float NOT NULL,
  width           float NOT NULL,
  height          float NOT NULL,

  -- face-api.js descriptor for cross-photo matching (128 floats as jsonb)
  face_descriptor jsonb NOT NULL,

  -- Source tracking
  detection_source text NOT NULL DEFAULT 'face-api-js',
  named_by_admin  boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_face_tags_photo ON public.face_tags(photo_id);
CREATE INDEX IF NOT EXISTS idx_face_tags_person ON public.face_tags(person_slug) WHERE person_slug IS NOT NULL;

ALTER TABLE public.face_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS face_tags_public_select ON public.face_tags;
CREATE POLICY face_tags_public_select ON public.face_tags
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.photos WHERE photos.id = face_tags.photo_id AND photos.status = 'approved'
  ));

DROP POLICY IF EXISTS face_tags_public_all ON public.face_tags;
CREATE POLICY face_tags_public_all ON public.face_tags
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Known faces reference (for cross-photo matching)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.known_faces (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),

  person_slug     text NOT NULL UNIQUE,
  person_name     text NOT NULL,

  -- Representative descriptor (average of all confirmed tags for this person)
  avg_descriptor  jsonb NOT NULL,

  -- Count of confirmed tags used to build the average
  sample_count    int NOT NULL DEFAULT 1
);

ALTER TABLE public.known_faces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS known_faces_public_select ON public.known_faces;
CREATE POLICY known_faces_public_select ON public.known_faces
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS known_faces_public_all ON public.known_faces;
CREATE POLICY known_faces_public_all ON public.known_faces
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Photo reports table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.photo_reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),

  photo_id        uuid NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  reporter_ip     inet,
  reason          text,

  resolved        boolean NOT NULL DEFAULT false,
  resolved_at     timestamptz,
  resolution      text
);

ALTER TABLE public.photo_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS photo_reports_public_insert ON public.photo_reports;
CREATE POLICY photo_reports_public_insert ON public.photo_reports
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS photo_reports_public_select ON public.photo_reports;
CREATE POLICY photo_reports_public_select ON public.photo_reports
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS photo_reports_public_update ON public.photo_reports;
CREATE POLICY photo_reports_public_update ON public.photo_reports
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Photo likes table (lightweight engagement)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.photo_likes (
  photo_id        uuid NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  liker_ip        inet NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (photo_id, liker_ip)
);

ALTER TABLE public.photo_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS photo_likes_public_all ON public.photo_likes;
CREATE POLICY photo_likes_public_all ON public.photo_likes
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Site config additions
-- ---------------------------------------------------------------------------
ALTER TABLE public.site_config
  ADD COLUMN IF NOT EXISTS photo_upload_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE public.site_config
  ADD COLUMN IF NOT EXISTS photo_upload_code text DEFAULT 'ANKHIL2026';

ALTER TABLE public.site_config
  ADD COLUMN IF NOT EXISTS photos_visible_after timestamptz;

-- ---------------------------------------------------------------------------
-- Helper: is photo publicly visible right now?
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_photo_visible(p_photo_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.photos ph
    JOIN public.site_config sc ON sc.id = true
    WHERE ph.id = p_photo_id
      AND ph.status = 'approved'
      AND sc.photo_upload_enabled = true
      AND (ph.visible_from IS NULL OR ph.visible_from <= now())
      AND (sc.photos_visible_after IS NULL OR sc.photos_visible_after <= now())
  );
$$;

REVOKE ALL ON FUNCTION public.is_photo_visible(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_photo_visible(uuid) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- RPC: atomically increment photo likes
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_photo_likes(p_photo_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.photos
  SET likes_count = likes_count + 1
  WHERE id = p_photo_id;
$$;

REVOKE ALL ON FUNCTION public.increment_photo_likes(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_photo_likes(uuid) TO anon, authenticated;
