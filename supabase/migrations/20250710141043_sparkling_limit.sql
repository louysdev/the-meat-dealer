/*
  # Agregar relación con perfiles del catálogo principal

  1. Modificaciones a la tabla
    - Agregar columna `main_profile_id` a `private_video_profiles`
    - Foreign key opcional al catálogo principal
    - Índice para mejorar rendimiento

  2. Funciones auxiliares
    - Función para obtener información del perfil principal relacionado
*/

-- Agregar relación opcional con el catálogo principal
ALTER TABLE private_video_profiles ADD COLUMN IF NOT EXISTS main_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_private_video_profiles_main_profile ON private_video_profiles(main_profile_id);

-- Función para obtener información completa del perfil privado con relación
CREATE OR REPLACE FUNCTION get_private_profile_with_main(profile_uuid uuid)
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  body_size text,
  created_at timestamptz,
  updated_at timestamptz,
  main_profile_id uuid,
  main_profile_name text,
  main_profile_age integer,
  main_profile_residence text,
  videos_count integer,
  photos_count integer,
  total_duration_minutes integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pvp.id,
    pvp.name,
    pvp.description,
    pvp.body_size,
    pvp.created_at,
    pvp.updated_at,
    pvp.main_profile_id,
    CASE 
      WHEN p.id IS NOT NULL THEN p.first_name || ' ' || p.last_name
      ELSE NULL
    END as main_profile_name,
    p.age as main_profile_age,
    p.residence as main_profile_residence,
    COALESCE((SELECT COUNT(*)::integer FROM private_videos WHERE profile_id = pvp.id), 0) as videos_count,
    COALESCE((SELECT COUNT(*)::integer FROM private_photos WHERE profile_id = pvp.id), 0) as photos_count,
    COALESCE((SELECT (SUM(duration_seconds) / 60)::integer FROM private_videos WHERE profile_id = pvp.id), 0) as total_duration_minutes
  FROM private_video_profiles pvp
  LEFT JOIN profiles p ON pvp.main_profile_id = p.id
  WHERE pvp.id = profile_uuid;
END;
$$ LANGUAGE plpgsql STABLE;