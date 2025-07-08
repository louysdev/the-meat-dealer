import { supabase } from '../lib/supabase';
import { User, CreateUserData } from '../types';
import { DatabaseUser } from '../lib/supabase';

// Función simple de hash (en producción usar bcrypt)
const hashPassword = async (password: string): Promise<string> => {
  // Para el admin legacy, usar un hash específico
  if (password === 'meatdealer2025') {
    return 'a8b8c8d8e8f8a8b8c8d8e8f8a8b8c8d8e8f8a8b8c8d8e8f8a8b8c8d8e8f8a8b8c8d8';
  }
  
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'meatdealer_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    // Fallback simple si crypto.subtle no está disponible
    return password + '_hashed_' + Date.now().toString();
  }
};

// Verificar contraseña
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
};

// Convertir usuario de la base de datos al tipo de la aplicación
const convertDatabaseUserToUser = (dbUser: DatabaseUser): User => ({
  id: dbUser.id,
  fullName: dbUser.full_name,
  username: dbUser.username,
  role: dbUser.role,
  isActive: dbUser.is_active,
  createdAt: new Date(dbUser.created_at),
  updatedAt: new Date(dbUser.updated_at),
  createdBy: dbUser.created_by
});

// Autenticar usuario
export const authenticateUser = async (username: string, password: string): Promise<User | null> => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return null;
    }

    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return null;
    }

    return convertDatabaseUserToUser(user as DatabaseUser);
  } catch (error) {
    console.error('Error en authenticateUser:', error);
    return null;
  }
};

// Obtener todos los usuarios (solo para admins)
export const getUsers = async (): Promise<User[]> => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        *,
        created_by_user:created_by(full_name, username)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error obteniendo usuarios: ${error.message}`);
    }

    return (users || []).map(user => convertDatabaseUserToUser(user as DatabaseUser));
  } catch (error) {
    console.error('Error en getUsers:', error);
    throw error;
  }
};

// Crear nuevo usuario (solo para admins)
export const createUser = async (userData: CreateUserData, createdBy: string): Promise<User> => {
  try {
    const passwordHash = await hashPassword(userData.password);

    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        full_name: userData.fullName,
        username: userData.username,
        password_hash: passwordHash,
        role: userData.role,
        is_active: true,
        created_by: createdBy
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creando usuario: ${error.message}`);
    }

    return convertDatabaseUserToUser(user as DatabaseUser);
  } catch (error) {
    console.error('Error en createUser:', error);
    throw error;
  }
};

// Actualizar usuario
export const updateUser = async (userId: string, updates: Partial<CreateUserData>): Promise<User> => {
  try {
    const updateData: any = {};

    if (updates.fullName) updateData.full_name = updates.fullName;
    if (updates.username) updateData.username = updates.username;
    if (updates.role) updateData.role = updates.role;
    if (updates.password) {
      updateData.password_hash = await hashPassword(updates.password);
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error actualizando usuario: ${error.message}`);
    }

    return convertDatabaseUserToUser(user as DatabaseUser);
  } catch (error) {
    console.error('Error en updateUser:', error);
    throw error;
  }
};

// Activar/desactivar usuario
export const toggleUserStatus = async (userId: string, isActive: boolean): Promise<void> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ is_active: isActive })
      .eq('id', userId);

    if (error) {
      throw new Error(`Error actualizando estado del usuario: ${error.message}`);
    }
  } catch (error) {
    console.error('Error en toggleUserStatus:', error);
    throw error;
  }
};

// Eliminar usuario
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      throw new Error(`Error eliminando usuario: ${error.message}`);
    }
  } catch (error) {
    console.error('Error en deleteUser:', error);
    throw error;
  }
};

// Obtener usuario por ID
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return null;
    }

    return convertDatabaseUserToUser(user as DatabaseUser);
  } catch (error) {
    console.error('Error en getUserById:', error);
    return null;
  }
};