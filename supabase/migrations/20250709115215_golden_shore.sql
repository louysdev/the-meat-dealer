/*
  # Sistema de me gusta por usuario

  1. Nueva tabla
    - `profile_likes`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Seguridad
    - Habilitar RLS en la tabla `profile_likes`
    - Agregar políticas para permitir operaciones

  3. Índices
    - Índice único para evitar likes duplicados
    - Índices para mejorar rendimiento

  4. Migración de datos
    - Migrar favoritos existentes a la nueva tabla
    - Eliminar columna is_favorite obsoleta
*/

CREATE TABLE IF NOT EXISTS profile_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, user_id)
);

-- Habilitar RLS
ALTER TABLE profile_likes ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones
CREATE POLICY "Permitir todas las operaciones en profile_likes"
  ON profile_likes
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_profile_likes_profile_id ON profile_likes(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_likes_user_id ON profile_likes(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_likes_unique ON profile_likes(profile_id, user_id);

-- Migrar datos existentes de is_favorite a profile_likes
-- Nota: Como no tenemos información del usuario que marcó como favorito,
-- crearemos un usuario temporal para los favoritos existentes
DO $$
DECLARE
    temp_user_id uuid;
    profile_record RECORD;
BEGIN
    -- Generar UUID para el usuario temporal
    temp_user_id := gen_random_uuid();
    
    -- Crear usuario temporal para favoritos existentes si no existe
    INSERT INTO users (id, full_name, username, password_hash, role, is_active)
    VALUES (
        temp_user_id,
        'Usuario Legacy (Favoritos)',
        'legacy_favorites',
        'legacy_hash',
        'user',
        false
    ) ON CONFLICT (username) DO NOTHING;
    
    -- Si el usuario ya existía, obtener su ID
    IF NOT FOUND THEN
        SELECT id INTO temp_user_id FROM users WHERE username = 'legacy_favorites';
    END IF;
    
    -- Migrar favoritos existentes solo si la columna is_favorite existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_favorite'
    ) THEN
        FOR profile_record IN 
            SELECT id FROM profiles WHERE is_favorite = true
        LOOP
            INSERT INTO profile_likes (profile_id, user_id)
            VALUES (profile_record.id, temp_user_id)
            ON CONFLICT (profile_id, user_id) DO NOTHING;
        END LOOP;
        
        -- Eliminar la columna is_favorite ya que ahora usamos la tabla profile_likes
        ALTER TABLE profiles DROP COLUMN is_favorite;
    END IF;
END $$;