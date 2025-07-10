import React, { useState, useEffect } from 'react';
import { Shield, Save, X, User, Link } from 'lucide-react';
import { CreatePrivateVideoProfileData, PrivateVideoProfile, PrivateVideo, PrivatePhoto, User as UserType } from '../types';
import { getMainProfiles, getPrivateProfileMedia } from '../services/privateVideoService';
import { PrivateMediaUpload } from './PrivateMediaUpload';

interface EditPrivateVideoProfileFormProps {
  profile: PrivateVideoProfile;
  currentUser: UserType | null;
  onSubmit: (profileData: Partial<CreatePrivateVideoProfileData>) => Promise<void>;
  onCancel: () => void;
}

interface MainProfile {
  id: string;
  name: string;
  age: number;
  residence?: string;
}

export const EditPrivateVideoProfileForm: React.FC<EditPrivateVideoProfileFormProps> = ({
  profile,
  currentUser,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<CreatePrivateVideoProfileData>({
    name: profile.name,
    description: profile.description,
    height: profile.height,
    bustSize: profile.bustSize,
    bodySize: profile.bodySize,
    mainProfileId: profile.mainProfileId || undefined
  });

  const [mainProfiles, setMainProfiles] = useState<MainProfile[]>([]);
  const [photos, setPhotos] = useState<PrivatePhoto[]>([]);
  const [videos, setVideos] = useState<PrivateVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    loadMainProfiles();
    loadMedia();
  }, []);

  // Actualizar información cuando se selecciona un perfil
  useEffect(() => {
    const selectedProfile = mainProfiles.find(p => p.id === formData.mainProfileId);
    if (selectedProfile && !formData.name.includes(selectedProfile.name)) {
      setFormData(prev => ({
        ...prev,
        name: `Contenido Privado de ${selectedProfile.name}`,
        description: `Videos y fotos exclusivos de ${selectedProfile.name} de ${selectedProfile.residence || 'República Dominicana'}`
      }));
    }
  }, [formData.mainProfileId, mainProfiles]);

  const loadMedia = async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoadingMedia(true);
      const media = await getPrivateProfileMedia(profile.id, currentUser.id);
      setPhotos(media.photos);
      setVideos(media.videos);
    } catch (error) {
      console.error('Error cargando media:', error);
    } finally {
      setLoadingMedia(false);
    }
  };

  const loadMainProfiles = async () => {
    try {
      setLoadingProfiles(true);
      const profiles = await getMainProfiles();
      setMainProfiles(profiles);
    } catch (error) {
      console.error('Error cargando perfiles principales:', error);
      setErrors(['Error cargando perfiles principales']);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const validateForm = (): string[] => {
    const newErrors: string[] = [];

    if (!formData.name.trim()) {
      newErrors.push('El nombre es requerido');
    }

    if (!formData.description.trim()) {
      newErrors.push('La descripción es requerida');
    }

    if (!formData.bodySize) {
      newErrors.push('El tamaño del cuerpo es requerido');
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors([]);

      await onSubmit(formData);
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      setErrors([error instanceof Error ? error.message : 'Error actualizando perfil']);
    } finally {
      setLoading(false);
    }
  };

  const bodySizes = [
    { value: 'XS', label: 'Extra Pequeño (XS)' },
    { value: 'S', label: 'Pequeño (S)' },
    { value: 'M', label: 'Mediano (M)' },
    { value: 'L', label: 'Grande (L)' },
    { value: 'XL', label: 'Extra Grande (XL)' },
    { value: 'XXL', label: 'Extra Extra Grande (XXL)' }
  ];

  const selectedMainProfile = mainProfiles.find(p => p.id === formData.mainProfileId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900/20">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-purple-400 fill-current animate-pulse" />
            <h2 className="text-2xl font-bold text-white">Editar Perfil Privado</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            <h4 className="text-red-300 font-medium mb-2">Por favor corrige los siguientes errores:</h4>
            <ul className="text-red-200 text-sm space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Asociar con perfil principal */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              <User className="w-4 h-4 inline mr-2" />
              Asociar con perfil principal (opcional)
            </label>
            <select
              value={formData.mainProfileId || ''}
              onChange={(e) => setFormData({ ...formData, mainProfileId: e.target.value || undefined })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              disabled={loadingProfiles}
            >
              <option value="">Sin asociar a ningún perfil</option>
              {mainProfiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} ({profile.age} años) - {profile.residence || 'Sin ubicación'}
                </option>
              ))}
            </select>
            {loadingProfiles && (
              <p className="text-gray-400 text-sm">Cargando perfiles...</p>
            )}
          </div>

          {/* Vista previa del perfil seleccionado */}
          {selectedMainProfile && (
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
              <div className="flex items-center space-x-2 text-green-400">
                <Link className="w-4 h-4" />
                <span className="font-medium">Asociado con:</span>
              </div>
              <div className="mt-2 text-white">
                <p className="font-medium">{selectedMainProfile.name}</p>
                <p className="text-gray-400 text-sm">
                  {selectedMainProfile.age} años • {selectedMainProfile.residence || 'Sin ubicación'}
                </p>
              </div>
            </div>
          )}

          {/* Nombre del perfil */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Nombre del perfil privado *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              placeholder="Ej: Contenido Privado de María"
              required
            />
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Descripción *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
              placeholder="Descripción del contenido privado..."
              required
            />
          </div>

          {/* Altura */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Altura *
            </label>
            <select
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: e.target.value as any })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              required
            >
              <option value="Pequeña">Pequeña</option>
              <option value="Mediana">Mediana</option>
              <option value="Alta">Alta</option>
            </select>
          </div>

          {/* Tamaño del cuerpo */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Tamaño del cuerpo *
            </label>
            <select
              value={formData.bodySize}
              onChange={(e) => setFormData({ ...formData, bodySize: e.target.value as any })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              required
            >
              {bodySizes.map(size => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tamaño del busto */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Tamaño del busto *
            </label>
            <select
              value={formData.bustSize}
              onChange={(e) => setFormData({ ...formData, bustSize: e.target.value as any })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              required
            >
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="XXL">XXL</option>
              <option value="XXXL">XXXL</option>
            </select>
          </div>

          {/* Gestión de Media */}
          {currentUser?.id && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Fotos y Videos
              </label>
              {loadingMedia ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">Cargando contenido...</p>
                </div>
              ) : (
                <PrivateMediaUpload
                  profileId={profile.id}
                  photos={photos}
                  videos={videos}
                  onMediaChange={loadMedia}
                  currentUserId={currentUser.id}
                  maxItems={12}
                />
              )}
            </div>
          )}

          {/* Botones */}
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Actualizando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Actualizar Perfil</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
};
