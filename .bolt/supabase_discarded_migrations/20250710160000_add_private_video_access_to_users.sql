-- Agregar campo para controlar el acceso a videos privados por usuario
ALTER TABLE users 
ADD COLUMN can_access_private_videos BOOLEAN DEFAULT false;

-- Establecer que todos los administradores existentes tengan acceso
UPDATE users 
SET can_access_private_videos = true 
WHERE role = 'admin';

-- Comentario para documentar el propósito del campo
COMMENT ON COLUMN users.can_access_private_videos IS 'Controla si el usuario puede acceder a la sección de videos privados';
