-- Verificar y ajustar configuración de RLS para comentarios privados

-- Habilitar RLS en las tablas de comentarios privados
ALTER TABLE private_video_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_video_comment_likes ENABLE ROW LEVEL SECURITY;

-- Política para leer comentarios privados
DROP POLICY IF EXISTS "Usuarios con acceso pueden ver comentarios privados" ON private_video_comments;
CREATE POLICY "Usuarios con acceso pueden ver comentarios privados" ON private_video_comments
    FOR SELECT 
    USING (
        -- Solo usuarios con acceso a videos privados o administradores
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.can_access_private_videos = true)
        )
        AND is_deleted = false
        AND (is_hidden = false OR EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        ))
    );

-- Política para crear comentarios privados
DROP POLICY IF EXISTS "Usuarios con acceso pueden crear comentarios privados" ON private_video_comments;
CREATE POLICY "Usuarios con acceso pueden crear comentarios privados" ON private_video_comments
    FOR INSERT 
    WITH CHECK (
        -- Solo usuarios con acceso a videos privados o administradores
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.can_access_private_videos = true)
        )
        AND user_id = auth.uid()
    );

-- Política para editar comentarios privados
DROP POLICY IF EXISTS "Usuarios pueden editar sus comentarios privados" ON private_video_comments;
CREATE POLICY "Usuarios pueden editar sus comentarios privados" ON private_video_comments
    FOR UPDATE 
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Política para moderación de comentarios privados (solo admin)
DROP POLICY IF EXISTS "Admins pueden moderar comentarios privados" ON private_video_comments;
CREATE POLICY "Admins pueden moderar comentarios privados" ON private_video_comments
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Política para eliminar comentarios privados
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus comentarios privados" ON private_video_comments;
CREATE POLICY "Usuarios pueden eliminar sus comentarios privados" ON private_video_comments
    FOR UPDATE 
    USING (
        user_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        user_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Políticas para likes de comentarios privados
DROP POLICY IF EXISTS "Usuarios con acceso pueden ver likes de comentarios privados" ON private_video_comment_likes;
CREATE POLICY "Usuarios con acceso pueden ver likes de comentarios privados" ON private_video_comment_likes
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.can_access_private_videos = true)
        )
    );

DROP POLICY IF EXISTS "Usuarios con acceso pueden dar like/dislike a comentarios privados" ON private_video_comment_likes;
CREATE POLICY "Usuarios con acceso pueden dar like/dislike a comentarios privados" ON private_video_comment_likes
    FOR ALL 
    USING (
        user_id = auth.uid() 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.can_access_private_videos = true)
        )
    )
    WITH CHECK (
        user_id = auth.uid() 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.can_access_private_videos = true)
        )
    );

-- Función para obtener comentarios privados con estadísticas (para moderación)
CREATE OR REPLACE FUNCTION get_private_video_comments_for_moderation()
RETURNS TABLE (
    comment_id UUID,
    profile_id UUID,
    user_id UUID,
    parent_comment_id UUID,
    content TEXT,
    is_deleted BOOLEAN,
    is_hidden BOOLEAN,
    is_edited BOOLEAN,
    hidden_reason TEXT,
    hidden_by UUID,
    hidden_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    likes_count BIGINT,
    dislikes_count BIGINT,
    replies_count BIGINT
) 
LANGUAGE sql SECURITY DEFINER
AS $$
    SELECT 
        pvc.id as comment_id,
        pvc.profile_id,
        pvc.user_id,
        pvc.parent_comment_id,
        pvc.content,
        pvc.is_deleted,
        pvc.is_hidden,
        pvc.is_edited,
        pvc.hidden_reason,
        pvc.hidden_by,
        pvc.hidden_at,
        pvc.created_at,
        pvc.updated_at,
        COALESCE(likes.count, 0) as likes_count,
        COALESCE(dislikes.count, 0) as dislikes_count,
        COALESCE(replies.count, 0) as replies_count
    FROM private_video_comments pvc
    LEFT JOIN (
        SELECT comment_id, COUNT(*) as count
        FROM private_video_comment_likes
        WHERE is_like = true
        GROUP BY comment_id
    ) likes ON pvc.id = likes.comment_id
    LEFT JOIN (
        SELECT comment_id, COUNT(*) as count
        FROM private_video_comment_likes
        WHERE is_like = false
        GROUP BY comment_id
    ) dislikes ON pvc.id = dislikes.comment_id
    LEFT JOIN (
        SELECT parent_comment_id, COUNT(*) as count
        FROM private_video_comments
        WHERE parent_comment_id IS NOT NULL AND is_deleted = false
        GROUP BY parent_comment_id
    ) replies ON pvc.id = replies.parent_comment_id
    ORDER BY pvc.created_at DESC;
$$;

-- Dar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION get_private_video_comments_for_moderation() TO authenticated;
