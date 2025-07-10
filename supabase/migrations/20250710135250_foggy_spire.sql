/*
  # Sistema de Videos Privados Exclusivos

  1. Nuevas tablas
    - `private_video_profiles` - Perfiles para videos privados
    - `private_videos` - Videos privados asociados a perfiles
    - `private_video_access` - Control de acceso por usuario
    - `private_video_comments` - Comentarios para videos privados
    - `private_video_comment_likes` - Likes en comentarios de videos privados

  2. Características
    - Videos privados por perfil
    - Control de acceso granular por usuario
    - Sistema de comentarios independiente
    - Gestión por administradores

  3. Seguridad
    - RLS habilitado en todas las tablas
    - Políticas específicas para acceso privado
*/

-- Tabla de perfiles para videos privados
CREATE TABLE IF NOT EXISTS private_video_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  body_size text NOT NULL CHECK (body_size IN ('S', 'M', 'L', 'XL', 'XXL', 'XXXL')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla de videos privados
CREATE TABLE IF NOT EXISTS private_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES private_video_profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  video_url text NOT NULL,
  thumbnail_url text,
  duration_seconds integer,
  file_size_mb decimal(10,2),
  video_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla de fotos privadas (para complementar los videos)
CREATE TABLE IF NOT EXISTS private_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES private_video_profiles(id) ON DELETE CASCADE NOT NULL,
  photo_url text NOT NULL,
  photo_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla de control de acceso
CREATE TABLE IF NOT EXISTS private_video_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES private_video_profiles(id) ON DELETE CASCADE NOT NULL,
  can_view boolean DEFAULT true,
  can_upload boolean DEFAULT false,
  granted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  granted_at timestamptz DEFAULT now(),
  UNIQUE(user_id, profile_id)
);

-- Tabla de comentarios para videos privados
CREATE TABLE IF NOT EXISTS private_video_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES private_video_profiles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  parent_comment_id uuid REFERENCES private_video_comments(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(content) > 0 AND length(content) <= 1000),
  is_deleted boolean DEFAULT false,
  is_hidden boolean DEFAULT false,
  is_edited boolean DEFAULT false,
  hidden_reason text,
  hidden_by uuid REFERENCES users(id),
  hidden_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla de likes para comentarios de videos privados
CREATE TABLE IF NOT EXISTS private_video_comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid REFERENCES private_video_comments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  is_like boolean NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Habilitar RLS en todas las tablas
ALTER TABLE private_video_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_video_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_video_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_video_comment_likes ENABLE ROW LEVEL SECURITY;

-- Políticas para private_video_profiles
CREATE POLICY "Usuarios con acceso pueden ver perfiles privados"
  ON private_video_profiles
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM private_video_access 
      WHERE profile_id = private_video_profiles.id 
      AND user_id = auth.uid()
      AND can_view = true
    ) OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Solo admins pueden crear perfiles privados"
  ON private_video_profiles
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Solo admins pueden actualizar perfiles privados"
  ON private_video_profiles
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Solo admins pueden eliminar perfiles privados"
  ON private_video_profiles
  FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Políticas para private_videos
CREATE POLICY "Usuarios con acceso pueden ver videos privados"
  ON private_videos
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM private_video_access 
      WHERE profile_id = private_videos.profile_id 
      AND user_id = auth.uid()
      AND can_view = true
    ) OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Usuarios con permisos pueden subir videos"
  ON private_videos
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM private_video_access 
      WHERE profile_id = private_videos.profile_id 
      AND user_id = auth.uid()
      AND can_upload = true
    ) OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Políticas similares para private_photos
CREATE POLICY "Usuarios con acceso pueden ver fotos privadas"
  ON private_photos
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM private_video_access 
      WHERE profile_id = private_photos.profile_id 
      AND user_id = auth.uid()
      AND can_view = true
    ) OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Usuarios con permisos pueden subir fotos privadas"
  ON private_photos
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM private_video_access 
      WHERE profile_id = private_photos.profile_id 
      AND user_id = auth.uid()
      AND can_upload = true
    ) OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Políticas para private_video_access
CREATE POLICY "Solo admins pueden gestionar accesos"
  ON private_video_access
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Políticas para comentarios (similar al sistema público)
CREATE POLICY "Usuarios con acceso pueden ver comentarios privados"
  ON private_video_comments
  FOR SELECT
  TO public
  USING (
    (NOT is_hidden OR is_hidden IS NULL) AND
    (EXISTS (
      SELECT 1 FROM private_video_access 
      WHERE profile_id = private_video_comments.profile_id 
      AND user_id = auth.uid()
      AND can_view = true
    ) OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    ))
  );

CREATE POLICY "Usuarios con acceso pueden comentar"
  ON private_video_comments
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM private_video_access 
      WHERE profile_id = private_video_comments.profile_id 
      AND user_id = auth.uid()
      AND can_view = true
    ) OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Crear índices para mejor rendimiento
CREATE INDEX idx_private_video_profiles_created_by ON private_video_profiles(created_by);
CREATE INDEX idx_private_videos_profile_id ON private_videos(profile_id);
CREATE INDEX idx_private_photos_profile_id ON private_photos(profile_id);
CREATE INDEX idx_private_video_access_user_id ON private_video_access(user_id);
CREATE INDEX idx_private_video_access_profile_id ON private_video_access(profile_id);
CREATE INDEX idx_private_video_comments_profile_id ON private_video_comments(profile_id);
CREATE INDEX idx_private_video_comments_user_id ON private_video_comments(user_id);

-- Triggers para updated_at
CREATE TRIGGER update_private_video_profiles_updated_at
  BEFORE UPDATE ON private_video_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_private_video_comments_updated_at
  BEFORE UPDATE ON private_video_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Crear buckets de storage para videos privados
INSERT INTO storage.buckets (id, name, public)
VALUES ('private-videos', 'private-videos', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('private-photos', 'private-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para videos privados (solo acceso autenticado)
CREATE POLICY "Solo usuarios autenticados pueden subir videos privados"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'private-videos');

CREATE POLICY "Solo usuarios con acceso pueden ver videos privados"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'private-videos');

CREATE POLICY "Solo usuarios autenticados pueden subir fotos privadas"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'private-photos');

CREATE POLICY "Solo usuarios con acceso pueden ver fotos privadas"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'private-photos');

-- Funciones auxiliares
CREATE OR REPLACE FUNCTION get_private_video_stats(profile_uuid uuid)
RETURNS TABLE(
  videos_count integer,
  photos_count integer,
  total_duration_minutes integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((SELECT COUNT(*)::integer FROM private_videos WHERE profile_id = profile_uuid), 0) as videos_count,
    COALESCE((SELECT COUNT(*)::integer FROM private_photos WHERE profile_id = profile_uuid), 0) as photos_count,
    COALESCE((SELECT (SUM(duration_seconds) / 60)::integer FROM private_videos WHERE profile_id = profile_uuid), 0) as total_duration_minutes;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION user_has_private_access(user_uuid uuid, profile_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM private_video_access 
    WHERE user_id = user_uuid 
    AND profile_id = profile_uuid 
    AND can_view = true
  ) OR EXISTS (
    SELECT 1 
    FROM users 
    WHERE id = user_uuid 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE;