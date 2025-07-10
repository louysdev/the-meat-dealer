import { useState, useEffect } from 'react';
import { Profile } from '../types';
import * as profileService from '../services/profileService';

export const useProfiles = (currentUserId?: string) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar perfiles
  const loadProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await profileService.getProfiles(currentUserId);
      setProfiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error cargando perfiles:', err);
    } finally {
      setLoading(false);
    }
  };

  // Agregar perfil
  const addProfile = async (profileData: Omit<Profile, 'id' | 'createdAt'>, createdByUserId?: string) => {
    try {
      setError(null);
      const newProfile = await profileService.createProfile(profileData, createdByUserId);
      setProfiles(prev => [newProfile, ...prev]);
      return newProfile;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creando perfil');
      throw err;
    }
  };

  // Actualizar perfil
  const updateProfile = async (updatedProfile: Profile) => {
    try {
      setError(null);
      console.log('Hook: Iniciando actualización de perfil');
      const updated = await profileService.updateProfile(updatedProfile);
      console.log('Hook: Perfil actualizado exitosamente');
      setProfiles(prev => prev.map(p => p.id === updated.id ? updated : p));
      return updated;
    } catch (err) {
      console.error('Hook: Error actualizando perfil:', err);
      setError(err instanceof Error ? err.message : 'Error actualizando perfil');
      throw err;
    }
  };

  // Eliminar perfil
  const deleteProfile = async (profileId: string) => {
    try {
      setError(null);
      await profileService.deleteProfile(profileId);
      setProfiles(prev => prev.filter(p => p.id !== profileId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando perfil');
      throw err;
    }
  };

  // Alternar like
  const toggleLike = async (profileId: string) => {
    try {
      setError(null);
      if (!currentUserId) {
        throw new Error('Usuario no autenticado');
      }

      const { isLiked, likesCount } = await profileService.toggleLike(profileId, currentUserId);
      
      setProfiles(prev => prev.map(p => 
        p.id === profileId ? { 
          ...p, 
          isLikedByCurrentUser: isLiked,
          likesCount: likesCount
        } : p
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualizando like');
      throw err;
    }
  };

  useEffect(() => {
    loadProfiles();
  }, [currentUserId]);

  return {
    profiles,
    loading,
    error,
    addProfile,
    updateProfile,
    deleteProfile,
    toggleLike,
    refreshProfiles: loadProfiles
  };
};