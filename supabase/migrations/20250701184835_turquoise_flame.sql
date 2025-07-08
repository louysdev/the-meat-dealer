/*
  # Crear tabla de perfiles

  1. Nueva tabla
    - `profiles`
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `age` (integer)
      - `net_salary` (text)
      - `father_job` (text)
      - `mother_job` (text)
      - `height` (text)
      - `body_size` (text)
      - `bust_size` (text)
      - `skin_color` (text)
      - `nationality` (text)
      - `residence` (text)
      - `living_with` (text)
      - `instagram` (text)
      - `music_tags` (text array)
      - `place_tags` (text array)
      - `is_favorite` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Seguridad
    - Habilitar RLS en la tabla `profiles`
    - Agregar política para permitir todas las operaciones (sitio público)
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  age integer NOT NULL CHECK (age >= 18 AND age <= 60),
  net_salary text DEFAULT '',
  father_job text DEFAULT '',
  mother_job text DEFAULT '',
  height text NOT NULL CHECK (height IN ('Pequeña', 'Mediana', 'Alta')),
  body_size text NOT NULL CHECK (body_size IN ('S', 'M', 'L', 'XL', 'XXL', 'XXXL')),
  bust_size text NOT NULL CHECK (bust_size IN ('S', 'M', 'L', 'XL', 'XXL', 'XXXL')),
  skin_color text NOT NULL CHECK (skin_color IN ('Blanca', 'India', 'Morena')),
  nationality text DEFAULT '',
  residence text DEFAULT '',
  living_with text NOT NULL CHECK (living_with IN ('Sola', 'Con la familia', 'Con una amiga')),
  instagram text DEFAULT '',
  music_tags text[] DEFAULT '{}',
  place_tags text[] DEFAULT '{}',
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones (sitio público)
CREATE POLICY "Permitir todas las operaciones en profiles"
  ON profiles
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();