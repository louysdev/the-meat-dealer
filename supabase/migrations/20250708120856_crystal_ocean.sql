/*
  # Agregar estado de disponibilidad a perfiles

  1. Modificaciones a la tabla
    - Agregar columna `is_available` a la tabla `profiles`
    - Valor por defecto: true (disponible)

  2. Seguridad
    - Mantener las mismas políticas de acceso
*/

-- Agregar columna de disponibilidad
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;

-- Comentario para documentar el campo
COMMENT ON COLUMN profiles.is_available IS 'Estado de disponibilidad: true = disponible 😏, false = no disponible 😔';