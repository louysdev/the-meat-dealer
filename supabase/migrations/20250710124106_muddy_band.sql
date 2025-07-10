/*
  # Agregar soporte para cifrado de archivos

  1. Cambios en la tabla
    - Agregar columna `encryption_metadata` para almacenar información de cifrado
  
  2. Storage
    - Crear bucket para archivos cifrados
    - Configurar políticas de acceso para el bucket
*/

-- Agregar columna para metadata de cifrado
ALTER TABLE profile_photos 
ADD COLUMN IF NOT EXISTS encryption_metadata TEXT;

-- Comentario explicativo
COMMENT ON COLUMN profile_photos.encryption_metadata IS 'Metadata JSON para descifrar archivos cifrados (salt, iv, etc.)';

-- Crear bucket para archivos cifrados si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('encrypted-files', 'encrypted-files', true)
ON CONFLICT (id) DO NOTHING;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Permitir subida de archivos cifrados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir lectura de archivos cifrados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir eliminación de archivos cifrados" ON storage.objects;

-- Política para permitir subida de archivos cifrados
CREATE POLICY "Permitir subida de archivos cifrados"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'encrypted-files');

-- Política para permitir lectura de archivos cifrados
CREATE POLICY "Permitir lectura de archivos cifrados"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'encrypted-files');

-- Política para permitir eliminación de archivos cifrados
CREATE POLICY "Permitir eliminación de archivos cifrados"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'encrypted-files');