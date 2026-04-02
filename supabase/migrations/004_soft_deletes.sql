-- Add soft-delete support to orders and additional_charges.
-- A non-null deleted_at means the record has been soft-deleted
-- and should be excluded from all application queries.

alter table public.orders
  add column if not exists deleted_at timestamptz;

alter table public.additional_charges
  add column if not exists deleted_at timestamptz;
