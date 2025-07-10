import { useState, useEffect } from 'react';
import { PrivateVideoProfile } from '../types';
import { getPrivateVideoProfiles } from '../services/privateVideoService';

export const usePrivateVideos = (currentUserId?: string) => {
  const [profiles, setProfiles] = useState<PrivateVideoProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar perfiles de videos privados
  const loadProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPrivateVideoProfiles(currentUserId);
      setProfiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error cargando perfiles de videos privados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      console.log('Hook: Cargando perfiles de videos privados para usuario:', currentUserId);
      loadProfiles();
    } else {
      setProfiles([]);
      setLoading(false);
    }
  }, [currentUserId]);

  return {
    profiles,
    loading,
    error,
    refreshProfiles: loadProfiles
  };
};