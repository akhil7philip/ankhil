-- Photos/Gallery section visibility toggle, controlled from /admin.
-- Default true (shown). When false, GallerySection is not rendered and the
-- Navigation drops the "Gallery" link.
ALTER TABLE public.site_config
  ADD COLUMN IF NOT EXISTS gallery_visible boolean NOT NULL DEFAULT true;
