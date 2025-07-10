/*
  # Corregir inconsistencias en el sistema de likes

  1. Verificar y corregir la tabla profile_likes
    - Asegurar que la tabla existe con la estructura correcta
    - Verificar índices únicos
    - Limpiar datos duplicados si existen

  2. Verificar políticas RLS
    - Asegurar que las políticas permiten operaciones correctas

  3. Agregar función para obtener conteo de likes de forma consistente
*/

-- Verificar que la tabla profile_likes existe con la estructura correcta
CREATE TABLE IF NOT EXISTS profile_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Eliminar duplicados si existen
DELETE FROM profile_likes a USING profile_likes b 
WHERE a.id < b.id 
AND a.profile_id = b.profile_id 
AND a.user_id = b.user_id;

-- Asegurar que existe la restricción única
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profile_likes_profile_id_user_id_key'
  ) THEN
    ALTER TABLE profile_likes ADD CONSTRAINT profile_likes_profile_id_user_id_key UNIQUE (profile_id, user_id);
  END IF;
END $$;

-- Recrear índices para asegurar consistencia
DROP INDEX IF EXISTS idx_profile_likes_profile_id;
DROP INDEX IF EXISTS idx_profile_likes_user_id;
DROP INDEX IF EXISTS idx_profile_likes_unique;

CREATE INDEX idx_profile_likes_profile_id ON profile_likes(profile_id);
CREATE INDEX idx_profile_likes_user_id ON profile_likes(user_id);
CREATE UNIQUE INDEX idx_profile_likes_unique ON profile_likes(profile_id, user_id);

-- Verificar RLS
ALTER TABLE profile_likes ENABLE ROW LEVEL SECURITY;

-- Recrear política para asegurar consistencia
DROP POLICY IF EXISTS "Permitir todas las operaciones en profile_likes" ON profile_likes;

CREATE POLICY "Permitir todas las operaciones en profile_likes"
  ON profile_likes
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Función para obtener conteo de likes de forma consistente
CREATE OR REPLACE FUNCTION get_profile_likes_count(profile_uuid uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer 
    FROM profile_likes 
    WHERE profile_id = profile_uuid
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Función para verificar si un usuario le dio like a un perfil
CREATE OR REPLACE FUNCTION user_liked_profile(profile_uuid uuid, user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM profile_likes 
    WHERE profile_id = profile_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql STABLE;