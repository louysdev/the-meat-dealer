import React, { useState, useEffect } from 'react';
import { Shield, Save, X, User, Link, Upload } from 'lucide-react';
import { CreatePrivateVideoProfileData } from '../types';
import { getMainProfiles } from '../services/privateVideoService';
import { MediaUpload } from './MediaUpload';

interface CreatePrivateVideoProfileFormProps {
  onSubmit: (profileData: CreatePrivateVideoProfileData) => Promise<void>;
  onCancel: () => void;
}

interface MainProfile {
  id: string;
  name: string;
  age: number;
  residence?: string;
}

interface SimpleMediaItem {
  url: string;
  type: 'photo' | 'video';
}

export const CreatePrivateVideoProfileForm: React.FC<CreatePrivateVideoProfileFormProps> = ({
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<CreatePrivateVideoProfileData>({
    name: '',
    description: '',
    height: 'Mediana',
    bodySize: 'M',
    bustSize: 'M',
    mainProfileId: undefined
  });

  const [mainProfiles, setMainProfiles] = useState<MainProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [media, setMedia] = useState<SimpleMediaItem[]>([]);

  useEffect(() => {
    loadMainProfiles();
  }, []);

  // Actualizar información cuando se selecciona un perfil
  useEffect(() => {
    const selectedProfile = mainProfiles.find(p => p.id === formData.mainProfileId);
    if (selectedProfile) {
      setFormData(prev => ({
        ...prev,
        name: `Contenido Privado de ${selectedProfile.name}`,
        description: `Videos y fotos exclusivos de ${selectedProfile.name}${selectedProfile.residence ? ` de ${selectedProfile.residence}` : ''}`
      }));
    } else if (formData.mainProfileId === 'anonymous') {
      setFormData(prev => ({
        ...prev,
        name: 'Anónimo',
        description: 'Videos y fotos exclusivos de perfil anónimo'
      }));
    }
  }, [formData.mainProfileId, mainProfiles]);

  const loadMainProfiles = async () => {
    try {
      const profiles = await getMainProfiles();
      setMainProfiles(profiles);
    } catch (error) {
      console.error('Error cargando perfiles principales:', error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!formData.mainProfileId) {
      newErrors.push('Debes seleccionar un perfil relacionado o la opción anónima');
    }

    if (!formData.name.trim()) {
      newErrors.push('El nombre es obligatorio');
    }

    if (!formData.description.trim()) {
      newErrors.push('La descripción es obligatoria');
    }

    if (media.length === 0) {
      newErrors.push('Se requiere al menos un archivo (foto o video)');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Convertir SimpleMediaItem a MediaItem
      const mediaItems = media.map((item, index) => ({
        id: `temp-${index}`, // ID temporal para la creación
        url: item.url,
        type: item.type,
        order: index
      }));

      // Preparar datos para envío incluyendo los archivos de media
      const profileDataToSubmit = {
        ...formData,
        mainProfileId: formData.mainProfileId === 'anonymous' ? undefined : formData.mainProfileId,
        media: mediaItems
      };

      await onSubmit(profileDataToSubmit);
    } catch (error) {
      console.error('Error creando perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedProfile = mainProfiles.find(p => p.id === formData.mainProfileId);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Crear Perfil de Videos Privados</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Messages */}
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
          {/* Relación con perfil principal */}
          <div className="bg-gray-800/50 rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-4 text-purple-300 border-b border-purple-800 pb-2">
              <Link className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Perfil Relacionado</h3>
            </div>

            {loadingProfiles ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
                <p className="text-gray-400 mt-2">Cargando perfiles...</p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Seleccionar Perfil *
                </label>
                <select
                  value={formData.mainProfileId || ''}
                  onChange={(e) => setFormData({ ...formData, mainProfileId: e.target.value || undefined })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Selecciona un perfil...</option>
                  <option value="anonymous">🎭 Perfil Anónimo</option>
                  {mainProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name} - {profile.age} años {profile.residence && `(${profile.residence})`}
                    </option>
                  ))}
                </select>
                
                {selectedProfile && (
                  <div className="mt-3 p-3 bg-purple-900/20 border border-purple-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-300 font-medium">Perfil Seleccionado:</span>
                    </div>
                    <p className="text-white mt-1">{selectedProfile.name}</p>
                    <p className="text-gray-400 text-sm">
                      {selectedProfile.age} años
                      {selectedProfile.residence && ` • ${selectedProfile.residence}`}
                    </p>
                  </div>
                )}

                {formData.mainProfileId === 'anonymous' && (
                  <div className="mt-3 p-3 bg-gray-900/20 border border-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">🎭</span>
                      <span className="text-gray-300 font-medium">Perfil Anónimo Seleccionado</span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                      El contenido no estará asociado a ningún perfil específico del catálogo
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Información básica (auto-generada) */}
          <div className="bg-gray-800/50 rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-4 text-purple-300 border-b border-purple-800 pb-2">
              <Shield className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Información del Perfil Privado</h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre del Perfil *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Se generará automáticamente al seleccionar un perfil"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descripción *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  rows={3}
                  placeholder="Se generará automáticamente al seleccionar un perfil"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Altura
                </label>
                <select
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value as any })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Pequeña">Pequeña</option>
                  <option value="Mediana">Mediana</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tamaño del Cuerpo
                </label>
                <select
                  value={formData.bodySize}
                  onChange={(e) => setFormData({ ...formData, bodySize: e.target.value as any })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                  <option value="XXXL">XXXL</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tamaño del Busto
                </label>
                <select
                  value={formData.bustSize}
                  onChange={(e) => setFormData({ ...formData, bustSize: e.target.value as any })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                  <option value="XXXL">XXXL</option>
                </select>
              </div>
            </div>
          </div>

          {/* Subida de archivos usando MediaUpload */}
          <div className="bg-gray-800/50 rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-4 text-purple-300 border-b border-purple-800 pb-2">
              <Upload className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Contenido Privado</h3>
            </div>

            <MediaUpload
              media={media}
              onMediaChange={setMedia}
              maxItems={8}
            />
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Crear Perfil</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};