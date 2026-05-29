-- Passcode gate config: toggle + editable passcode
ALTER TABLE public.site_config
  ADD COLUMN IF NOT EXISTS enable_passcode_gate boolean NOT NULL DEFAULT true;

ALTER TABLE public.site_config
  ADD COLUMN IF NOT EXISTS passcode text NOT NULL DEFAULT 'rion';
