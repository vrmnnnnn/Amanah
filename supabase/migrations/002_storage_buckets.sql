-- Storage Buckets: Avatars
-- Create the 'avatars' bucket + RLS policies

-- Step 1: Create bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Step 2: RLS policies on storage.objects
-- Public read
CREATE POLICY "Public read avatars" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'avatars');

-- Authenticated upload
CREATE POLICY "Auth upload avatars" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

-- Owner update
CREATE POLICY "Auth update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND owner = auth.uid());

-- Owner delete
CREATE POLICY "Auth delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND owner = auth.uid());
