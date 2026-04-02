-- Add branding columns to settings table
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS shop_name text,
  ADD COLUMN IF NOT EXISTS logo_url  text,
  ADD COLUMN IF NOT EXISTS shop_id   uuid;  -- nullable; FK added in future multi-tenancy migration

-- Create Supabase Storage bucket for shop assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shop-assets',
  'shop-assets',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: public read (logo URLs are publicly accessible)
CREATE POLICY "shop_assets_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'shop-assets');

-- RLS: admin-only insert
CREATE POLICY "shop_assets_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'shop-assets'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- RLS: admin-only update
CREATE POLICY "shop_assets_admin_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'shop-assets'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- RLS: admin-only delete
CREATE POLICY "shop_assets_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'shop-assets'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
