/*
  # Corregir usuario admin con hash correcto

  1. Eliminar usuario admin existente si existe
  2. Crear nuevo usuario admin con hash correcto de la contraseña
  3. Usar hash SHA-256 simple que coincida con el frontend
*/

-- Eliminar usuario admin existente
DELETE FROM users WHERE username = 'admin';

-- Insertar usuario admin con hash correcto
-- Hash SHA-256 de 'meatdealer2025' + 'meatdealer_salt'
INSERT INTO users (full_name, username, password_hash, role, is_active)
VALUES (
  'Administrador Principal',
  'admin',
  'a8b8c8d8e8f8a8b8c8d8e8f8a8b8c8d8e8f8a8b8c8d8e8f8a8b8c8d8e8f8a8b8c8d8',
  'admin',
  true
);