-- Profile picture uploads (small avatars stored in dedicated bucket)

INSERT INTO storage.buckets (id, name, public)
VALUES ('ProfilePictures', 'ProfilePictures', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS profile_pictures_select ON storage.objects;
CREATE POLICY profile_pictures_select ON storage.objects
  FOR SELECT USING (bucket_id = 'ProfilePictures');

DROP POLICY IF EXISTS profile_pictures_insert ON storage.objects;
CREATE POLICY profile_pictures_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'ProfilePictures'
    AND (auth.uid())::text = (string_to_array(name, '/'))[1]
  );

DROP POLICY IF EXISTS profile_pictures_update ON storage.objects;
CREATE POLICY profile_pictures_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'ProfilePictures'
    AND (auth.uid())::text = (string_to_array(name, '/'))[1]
  )
  WITH CHECK (
    bucket_id = 'ProfilePictures'
    AND (auth.uid())::text = (string_to_array(name, '/'))[1]
  );

DROP POLICY IF EXISTS profile_pictures_delete ON storage.objects;
CREATE POLICY profile_pictures_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'ProfilePictures'
    AND (auth.uid())::text = (string_to_array(name, '/'))[1]
  );
