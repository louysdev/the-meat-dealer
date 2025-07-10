-- Crear tabla para comentarios de videos privados
CREATE TABLE private_video_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES private_video_profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES private_video_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false,
    is_edited BOOLEAN DEFAULT false,
    hidden_reason TEXT,
    hidden_by UUID REFERENCES users(id),
    hidden_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para likes/dislikes de comentarios privados
CREATE TABLE private_video_comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES private_video_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_like BOOLEAN NOT NULL, -- true para like, false para dislike
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id) -- Un usuario solo puede dar un like o dislike por comentario
);

-- Índices para optimizar consultas
CREATE INDEX idx_private_video_comments_profile_id ON private_video_comments(profile_id);
CREATE INDEX idx_private_video_comments_user_id ON private_video_comments(user_id);
CREATE INDEX idx_private_video_comments_parent_id ON private_video_comments(parent_comment_id);
CREATE INDEX idx_private_video_comments_created_at ON private_video_comments(created_at);
CREATE INDEX idx_private_video_comments_is_deleted ON private_video_comments(is_deleted);
CREATE INDEX idx_private_video_comments_is_hidden ON private_video_comments(is_hidden);

CREATE INDEX idx_private_video_comment_likes_comment_id ON private_video_comment_likes(comment_id);
CREATE INDEX idx_private_video_comment_likes_user_id ON private_video_comment_likes(user_id);
CREATE INDEX idx_private_video_comment_likes_is_like ON private_video_comment_likes(is_like);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_private_video_comments_updated_at BEFORE UPDATE ON private_video_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS (Row Level Security)
ALTER TABLE private_video_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_video_comment_likes ENABLE ROW LEVEL SECURITY;

-- Política para comentarios: Solo usuarios con acceso a videos privados pueden ver comentarios
CREATE POLICY "Users with private video access can view comments" ON private_video_comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.can_access_private_videos = true)
        )
    );

-- Política para comentarios: Solo usuarios con acceso pueden crear comentarios
CREATE POLICY "Users with private video access can create comments" ON private_video_comments
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.can_access_private_videos = true)
        )
    );

-- Política para comentarios: Los usuarios pueden editar sus propios comentarios
CREATE POLICY "Users can edit their own comments" ON private_video_comments
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Política para comentarios: Los usuarios pueden eliminar sus propios comentarios, los admins pueden eliminar cualquiera
CREATE POLICY "Users can delete their own comments, admins can delete any" ON private_video_comments
    FOR UPDATE
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Política para likes: Solo usuarios con acceso a videos privados pueden ver likes
CREATE POLICY "Users with private video access can view likes" ON private_video_comment_likes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.can_access_private_videos = true)
        )
    );

-- Política para likes: Solo usuarios con acceso pueden dar likes
CREATE POLICY "Users with private video access can manage likes" ON private_video_comment_likes
    FOR ALL
    USING (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.can_access_private_videos = true)
        )
    )
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.can_access_private_videos = true)
        )
    );

-- Comentarios para documentar las tablas
COMMENT ON TABLE private_video_comments IS 'Comentarios en perfiles de videos privados';
COMMENT ON TABLE private_video_comment_likes IS 'Likes y dislikes de comentarios en videos privados';

COMMENT ON COLUMN private_video_comments.profile_id IS 'ID del perfil de video privado';
COMMENT ON COLUMN private_video_comments.user_id IS 'ID del usuario que escribió el comentario';
COMMENT ON COLUMN private_video_comments.parent_comment_id IS 'ID del comentario padre (para respuestas)';
COMMENT ON COLUMN private_video_comments.content IS 'Contenido del comentario';
COMMENT ON COLUMN private_video_comments.is_deleted IS 'Indica si el comentario fue eliminado';
COMMENT ON COLUMN private_video_comments.is_hidden IS 'Indica si el comentario está oculto por moderación';
COMMENT ON COLUMN private_video_comments.is_edited IS 'Indica si el comentario fue editado';
COMMENT ON COLUMN private_video_comments.hidden_reason IS 'Razón por la cual el comentario fue ocultado';
COMMENT ON COLUMN private_video_comments.hidden_by IS 'ID del moderador que ocultó el comentario';
COMMENT ON COLUMN private_video_comments.hidden_at IS 'Fecha cuando el comentario fue ocultado';

COMMENT ON COLUMN private_video_comment_likes.comment_id IS 'ID del comentario';
COMMENT ON COLUMN private_video_comment_likes.user_id IS 'ID del usuario que dio el like/dislike';
COMMENT ON COLUMN private_video_comment_likes.is_like IS 'true para like, false para dislike';
