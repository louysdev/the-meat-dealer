import { User } from '../types';

// Función para verificar si un usuario puede acceder a videos privados
export const canUserAccessPrivateVideos = (user: User): boolean => {
  return user.role === 'admin' || user.canAccessPrivateVideos;
};

// Función para verificar si un usuario puede crear perfiles privados
export const canUserCreatePrivateProfiles = (user: User): boolean => {
  return canUserAccessPrivateVideos(user) && user.isActive;
};

// Función para verificar si un usuario puede editar un perfil privado específico
export const canUserEditPrivateProfile = (user: User, profileCreatedBy?: string): boolean => {
  if (!canUserAccessPrivateVideos(user) || !user.isActive) {
    return false;
  }
  
  // Los admins pueden editar cualquier perfil
  if (user.role === 'admin') {
    return true;
  }
  
  // Los usuarios solo pueden editar sus propios perfiles
  return profileCreatedBy === user.id;
};

// Función para verificar si un usuario puede eliminar un perfil privado específico
export const canUserDeletePrivateProfile = (user: User, profileCreatedBy?: string): boolean => {
  return canUserEditPrivateProfile(user, profileCreatedBy);
};
