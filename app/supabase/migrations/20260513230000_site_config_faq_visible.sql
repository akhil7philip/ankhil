-- FAQ section visibility toggle, controlled from /admin.
-- Default true (shown). When false, FAQSection returns null and the
-- Navigation drops the "FAQ" link.
ALTER TABLE public.site_config
  ADD COLUMN IF NOT EXISTS faq_visible boolean NOT NULL DEFAULT true;
