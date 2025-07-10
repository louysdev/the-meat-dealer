/*
  # Eliminar funcionalidad de encriptación

  1. Cambios en la tabla
    - Eliminar columna `encryption_metadata` de profile_photos
  
  2. Storage
    - Eliminar bucket de archivos cifrados
    - Eliminar políticas relacionadas con cifrado
*/

-- Eliminar columna de metadata de cifrado
ALTER TABLE profile_photos DROP COLUMN IF EXISTS encryption_metadata;

-- Eliminar políticas de storage para archivos cifrados
DROP POLICY IF EXISTS "Permitir subida de archivos cifrados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir lectura de archivos cifrados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir eliminación de archivos cifrados" ON storage.objects;

-- Eliminar bucket de archivos cifrados
DELETE FROM storage.buckets WHERE id = 'encrypted-files';