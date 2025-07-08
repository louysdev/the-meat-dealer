/*
  # Agregar soporte para videos en perfiles

  1. Modificaciones a la tabla
    - Agregar columna `video_url` a la tabla `profile_photos` (renombrarla a `profile_media`)
    - Agregar columna `media_type` para distinguir entre foto y video
    - Actualizar índices y políticas

  2. Storage
    - Crear bucket para videos de perfiles
    - Configurar políticas de storage para videos

  3. Seguridad
    - Mantener las mismas políticas de acceso público
*/

-- Agregar columnas para soporte de videos
ALTER TABLE profile_photos ADD COLUMN IF NOT EXISTS media_type text DEFAULT 'photo' CHECK (media_type IN ('photo', 'video'));
ALTER TABLE profile_photos ADD COLUMN IF NOT EXISTS video_url text;

-- Renombrar la tabla para reflejar que ahora maneja múltiples tipos de media
-- Nota: En producción, esto se haría con más cuidado para evitar downtime
-- Por ahora, mantenemos el nombre original para compatibilidad

-- Crear bucket para videos de perfiles
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-videos', 'profile-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para videos
CREATE POLICY "Permitir subida de videos de perfiles"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'profile-videos');

CREATE POLICY "Permitir lectura de videos de perfiles"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'profile-videos');

CREATE POLICY "Permitir eliminación de videos de perfiles"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'profile-videos');

-- Actualizar políticas existentes para incluir videos
CREATE POLICY "Permitir actualización de videos de perfiles"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'profile-videos');