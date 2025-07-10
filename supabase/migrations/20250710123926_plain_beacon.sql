/*
  # Agregar soporte para metadata de cifrado

  1. Cambios en tablas existentes
    - Agregar columna `encryption_metadata` a `profile_photos` para almacenar información de cifrado
    - Crear bucket para archivos cifrados

  2. Seguridad
    - Los archivos se almacenan cifrados en el storage
    - La metadata de cifrado se guarda en la base de datos
    - Solo la aplicación puede descifrar los archivos
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

-- Política para permitir subida de archivos cifrados
CREATE POLICY IF NOT EXISTS "Permitir subida de archivos cifrados"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'encrypted-files');

-- Política para permitir lectura de archivos cifrados
CREATE POLICY IF NOT EXISTS "Permitir lectura de archivos cifrados"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'encrypted-files');

-- Política para permitir eliminación de archivos cifrados
CREATE POLICY IF NOT EXISTS "Permitir eliminación de archivos cifrados"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'encrypted-files');