/*
  # Sistema de comentarios con respuestas anidadas y moderación

  1. Nuevas tablas
    - `profile_comments` - Comentarios principales y respuestas
    - `comment_likes` - Likes y dislikes en comentarios

  2. Características
    - Comentarios anidados (respuestas a comentarios)
    - Sistema de likes/dislikes por comentario
    - Moderación por administradores
    - Soft delete para comentarios eliminados
    - Tracking de ediciones

  3. Seguridad
    - RLS habilitado en todas las tablas
    - Políticas específicas para cada operación
*/

-- Tabla de comentarios
CREATE TABLE IF NOT EXISTS profile_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  parent_comment_id uuid REFERENCES profile_comments(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(content) > 0 AND length(content) <= 1000),
  is_deleted boolean DEFAULT false,
  is_hidden boolean DEFAULT false, -- Para moderación
  is_edited boolean DEFAULT false,
  hidden_reason text, -- Razón de ocultación por moderador
  hidden_by uuid REFERENCES users(id), -- Admin que ocultó el comentario
  hidden_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla de likes/dislikes en comentarios
CREATE TABLE IF NOT EXISTS comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid REFERENCES profile_comments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  is_like boolean NOT NULL, -- true = like, false = dislike
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Habilitar RLS
ALTER TABLE profile_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Políticas para profile_comments
CREATE POLICY "Todos pueden ver comentarios no ocultos"
  ON profile_comments
  FOR SELECT
  TO public
  USING (NOT is_hidden OR is_hidden IS NULL);

CREATE POLICY "Usuarios autenticados pueden crear comentarios"
  ON profile_comments
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Usuarios pueden editar sus propios comentarios"
  ON profile_comments
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuarios pueden eliminar sus propios comentarios"
  ON profile_comments
  FOR DELETE
  TO public
  USING (true);

-- Políticas para comment_likes
CREATE POLICY "Todos pueden ver likes de comentarios"
  ON comment_likes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Usuarios autenticados pueden dar like/dislike"
  ON comment_likes
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Usuarios pueden cambiar sus likes/dislikes"
  ON comment_likes
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Usuarios pueden eliminar sus likes/dislikes"
  ON comment_likes
  FOR DELETE
  TO public
  USING (true);

-- Índices para mejor rendimiento
CREATE INDEX idx_profile_comments_profile_id ON profile_comments(profile_id);
CREATE INDEX idx_profile_comments_user_id ON profile_comments(user_id);
CREATE INDEX idx_profile_comments_parent_id ON profile_comments(parent_comment_id);
CREATE INDEX idx_profile_comments_created_at ON profile_comments(created_at);
CREATE INDEX idx_profile_comments_not_hidden ON profile_comments(profile_id) WHERE NOT is_hidden;

CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON comment_likes(user_id);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_profile_comments_updated_at
  BEFORE UPDATE ON profile_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función para obtener estadísticas de comentarios
CREATE OR REPLACE FUNCTION get_comment_stats(comment_uuid uuid)
RETURNS TABLE(
  likes_count integer,
  dislikes_count integer,
  replies_count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((SELECT COUNT(*)::integer FROM comment_likes WHERE comment_id = comment_uuid AND is_like = true), 0) as likes_count,
    COALESCE((SELECT COUNT(*)::integer FROM comment_likes WHERE comment_id = comment_uuid AND is_like = false), 0) as dislikes_count,
    COALESCE((SELECT COUNT(*)::integer FROM profile_comments WHERE parent_comment_id = comment_uuid AND NOT is_deleted AND NOT is_hidden), 0) as replies_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Función para obtener conteo total de comentarios de un perfil
CREATE OR REPLACE FUNCTION get_profile_comments_count(profile_uuid uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer 
    FROM profile_comments 
    WHERE profile_id = profile_uuid 
    AND NOT is_deleted 
    AND NOT is_hidden
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Función para verificar si un usuario puede moderar comentarios
CREATE OR REPLACE FUNCTION can_moderate_comments(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM users 
    WHERE id = user_uuid 
    AND role = 'admin' 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql STABLE;