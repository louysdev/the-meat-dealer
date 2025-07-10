-- Agregar columnas height y bust_size a la tabla private_video_profiles

-- Agregar columna height
ALTER TABLE private_video_profiles 
ADD COLUMN IF NOT EXISTS height text CHECK (height IN ('Pequeña', 'Mediana', 'Alta'));

-- Agregar columna bust_size
ALTER TABLE private_video_profiles 
ADD COLUMN IF NOT EXISTS bust_size text CHECK (bust_size IN ('S', 'M', 'L', 'XL', 'XXL', 'XXXL'));

-- Actualizar registros existentes con valores por defecto
UPDATE private_video_profiles 
SET height = 'Mediana' 
WHERE height IS NULL;

UPDATE private_video_profiles 
SET bust_size = 'M' 
WHERE bust_size IS NULL;

-- Hacer las columnas NOT NULL después de establecer valores por defecto
ALTER TABLE private_video_profiles 
ALTER COLUMN height SET NOT NULL;

ALTER TABLE private_video_profiles 
ALTER COLUMN bust_size SET NOT NULL;
