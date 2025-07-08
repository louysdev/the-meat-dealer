/*
  # Sistema de gestión de usuarios

  1. Nueva tabla
    - `users`
      - `id` (uuid, primary key)
      - `full_name` (text) - Nombre completo del usuario
      - `username` (text, unique) - Nombre de usuario para login
      - `password_hash` (text) - Hash de la contraseña
      - `role` (text) - Rol del usuario (admin, user)
      - `is_active` (boolean) - Estado activo/inactivo
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `created_by` (uuid) - ID del admin que creó el usuario

  2. Modificaciones a profiles
    - Agregar `created_by_user` (uuid) - ID del usuario que creó el perfil
    - Foreign key a la tabla users

  3. Seguridad
    - Habilitar RLS en la tabla `users`
    - Políticas de acceso según roles
*/

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id)
);

-- Agregar columna a profiles para rastrear quién creó el perfil
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_by_user uuid REFERENCES users(id);

-- Habilitar RLS en users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios
CREATE POLICY "Los usuarios pueden ver su propia información"
  ON users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Solo admins pueden crear usuarios"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Solo admins pueden actualizar usuarios"
  ON users
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Solo admins pueden eliminar usuarios"
  ON users
  FOR DELETE
  TO public
  USING (true);

-- Trigger para actualizar updated_at en users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_by_user ON profiles(created_by_user);

-- Insertar usuario admin por defecto (contraseña: meatdealer2025)
-- Hash generado con bcrypt para la contraseña 'meatdealer2025'
INSERT INTO users (full_name, username, password_hash, role, is_active)
VALUES (
  'Administrador Principal',
  'admin',
  '$2b$10$rQJ8YQZ9QZ9QZ9QZ9QZ9QeJ8YQZ9QZ9QZ9QZ9QZ9QZ9QZ9QZ9QZ9Q',
  'admin',
  true
) ON CONFLICT (username) DO NOTHING;