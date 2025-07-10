/*
  # Función para obtener estadísticas de comentarios

  1. Funciones
    - `get_comment_stats` - Obtiene conteos de likes, dislikes y respuestas para un comentario
    - `get_profile_comments_count` - Obtiene el conteo total de comentarios de un perfil

  2. Seguridad
    - Las funciones son públicas y pueden ser llamadas por cualquier usuario autenticado
*/

-- Función para obtener estadísticas de un comentario
CREATE OR REPLACE FUNCTION get_comment_stats(comment_uuid UUID)
RETURNS TABLE (
  likes_count INTEGER,
  dislikes_count INTEGER,
  replies_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((
      SELECT COUNT(*)::INTEGER 
      FROM comment_likes 
      WHERE comment_id = comment_uuid AND is_like = true
    ), 0) as likes_count,
    COALESCE((
      SELECT COUNT(*)::INTEGER 
      FROM comment_likes 
      WHERE comment_id = comment_uuid AND is_like = false
    ), 0) as dislikes_count,
    COALESCE((
      SELECT COUNT(*)::INTEGER 
      FROM profile_comments 
      WHERE parent_comment_id = comment_uuid AND is_deleted = false
    ), 0) as replies_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener el conteo de comentarios de un perfil
CREATE OR REPLACE FUNCTION get_profile_comments_count(profile_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE((
    SELECT COUNT(*)::INTEGER 
    FROM profile_comments 
    WHERE profile_id = profile_uuid 
      AND is_deleted = false 
      AND is_hidden = false
  ), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;