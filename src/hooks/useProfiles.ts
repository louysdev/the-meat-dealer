import { useState, useEffect } from 'react';
import { Profile } from '../types';
import * as profileService from '../services/profileService';

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar perfiles
  const loadProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await profileService.getProfiles();
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
      const updated = await profileService.updateProfile(updatedProfile);
      setProfiles(prev => prev.map(p => p.id === updated.id ? updated : p));
      return updated;
    } catch (err) {
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

  // Alternar favorito
  const toggleFavorite = async (profileId: string) => {
    try {
      setError(null);
      const profile = profiles.find(p => p.id === profileId);
      if (!profile) return;

      const newFavoriteStatus = !profile.isFavorite;
      await profileService.toggleFavorite(profileId, newFavoriteStatus);
      
      setProfiles(prev => prev.map(p => 
        p.id === profileId ? { ...p, isFavorite: newFavoriteStatus } : p
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualizando favorito');
      throw err;
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  return {
    profiles,
    loading,
    error,
    addProfile,
    updateProfile,
    deleteProfile,
    toggleFavorite,
    refreshProfiles: loadProfiles
  };
};