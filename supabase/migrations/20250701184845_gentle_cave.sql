/*
  # Crear tabla de fotos de perfiles

  1. Nueva tabla
    - `profile_photos`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, foreign key)
      - `photo_url` (text)
      - `photo_order` (integer)
      - `created_at` (timestamp)

  2. Seguridad
    - Habilitar RLS en la tabla `profile_photos`
    - Agregar política para permitir todas las operaciones (sitio público)

  3. Storage
    - Crear bucket para fotos de perfiles
    - Configurar políticas de storage
*/

CREATE TABLE IF NOT EXISTS profile_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  photo_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE profile_photos ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones (sitio público)
CREATE POLICY "Permitir todas las operaciones en profile_photos"
  ON profile_photos
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_profile_photos_profile_id ON profile_photos(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_photos_order ON profile_photos(profile_id, photo_order);

-- Configurar storage bucket para fotos de perfiles
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Política de storage para permitir subida de archivos
CREATE POLICY "Permitir subida de fotos de perfiles"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'profile-photos');

-- Política de storage para permitir lectura de archivos
CREATE POLICY "Permitir lectura de fotos de perfiles"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'profile-photos');

-- Política de storage para permitir eliminación de archivos
CREATE POLICY "Permitir eliminación de fotos de perfiles"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'profile-photos');