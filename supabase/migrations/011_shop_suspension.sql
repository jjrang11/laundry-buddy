-- Add is_suspended flag to shops table.
-- When true, all admin/staff users belonging to this shop cannot log in or
-- access the dashboard. Data is fully preserved and the flag can be toggled
-- at any time by the platform owner.

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false;
