import React, { useState, useEffect } from 'react';
import { Shield, Save, X, User, FileText, Link, Upload, Video, Image } from 'lucide-react';
import { CreatePrivateVideoProfileData, CreatePrivateVideoData, CreatePrivatePhotoData } from '../types';
import { getMainProfiles, createPrivateVideoProfile, uploadPrivateVideo, uploadPrivatePhoto } from '../services/privateVideoService';

interface CreatePrivateVideoProfileFormProps {
  onSubmit: (profileData: CreatePrivateVideoProfileData) => Promise<void>;
  onCancel: () => void;
  currentUserId: string;
}

interface MainProfile {
  id: string;
  name: string;
  age: number;
  residence?: string;
}

export const CreatePrivateVideoProfileForm: React.FC<CreatePrivateVideoProfileFormProps> = ({
  onSubmit,
  onCancel,
  currentUserId
}) => {
  const [formData, setFormData] = useState<CreatePrivateVideoProfileData>({
    name: '',
    description: '',
    bodySize: 'M',
    mainProfileId: undefined
  });

  const [mainProfiles, setMainProfiles] = useState<MainProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  // Estados para subida de archivos
  const [videos, setVideos] = useState<File[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [videoTitles, setVideoTitles] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  useEffect(() => {
    loadMainProfiles();
  }, []);

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

    if (!formData.name.trim()) {
      newErrors.push('El nombre es obligatorio');
    }

    if (!formData.description.trim()) {
      newErrors.push('La descripción es obligatoria');
    }

    if (videos.length === 0 && photos.length === 0) {
      newErrors.push('Se requiere al menos un video o foto');
    }

    // Validar títulos de videos
    videos.forEach((_, index) => {
      if (!videoTitles[index]?.trim()) {
        newErrors.push(`El título del video ${index + 1} es obligatorio`);
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setVideos(prev => [...prev, ...files]);
    setVideoTitles(prev => [...prev, ...files.map(() => '')]);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos(prev => [...prev, ...files]);
  };

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
    setVideoTitles(prev => prev.filter((_, i) => i !== index));
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const updateVideoTitle = (index: number, title: string) => {
    setVideoTitles(prev => prev.map((t, i) => i === index ? title : t));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setUploadingFiles(true);

    try {
      // Crear el perfil primero
      await onSubmit(formData);

      // Nota: La subida de archivos se manejará después de crear el perfil
      // ya que necesitamos el ID del perfil creado
    } catch (error) {
      console.error('Error creando perfil:', error);
    } finally {
      setLoading(false);
      setUploadingFiles(false);
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
          {/* Información básica */}
          <div className="bg-gray-800/50 rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-4 text-purple-300 border-b border-purple-800 pb-2">
              <FileText className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Información Básica</h3>
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
                  placeholder="Ej: Contenido Exclusivo de María"
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
                  placeholder="Describe el contenido privado..."
                  required
                />
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
            </div>
          </div>

          {/* Relación con perfil principal */}
          <div className="bg-gray-800/50 rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-4 text-purple-300 border-b border-purple-800 pb-2">
              <Link className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Relación con Catálogo Principal</h3>
            </div>

            {loadingProfiles ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
                <p className="text-gray-400 mt-2">Cargando perfiles...</p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Perfil Relacionado (Opcional)
                </label>
                <select
                  value={formData.mainProfileId || ''}
                  onChange={(e) => setFormData({ ...formData, mainProfileId: e.target.value || undefined })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Sin relación específica</option>
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
              </div>
            )}
          </div>

          {/* Subida de Videos */}
          <div className="bg-gray-800/50 rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-4 text-purple-300 border-b border-purple-800 pb-2">
              <Video className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Videos Privados</h3>
            </div>

            <div className="space-y-4">
              {videos.map((video, index) => (
                <div key={index} className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-medium">Video {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeVideo(index)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Título del Video *
                      </label>
                      <input
                        type="text"
                        value={videoTitles[index] || ''}
                        onChange={(e) => updateVideoTitle(index, e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Título descriptivo del video"
                      />
                    </div>
                    
                    <div className="text-sm text-gray-400">
                      <p><strong>Archivo:</strong> {video.name}</p>
                      <p><strong>Tamaño:</strong> {(video.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                </div>
              ))}

              <div>
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleVideoChange}
                  className="hidden"
                  id="video-upload"
                />
                <label
                  htmlFor="video-upload"
                  className="flex items-center justify-center space-x-2 w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg cursor-pointer transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span>Agregar Videos</span>
                </label>
              </div>
            </div>
          </div>

          {/* Subida de Fotos */}
          <div className="bg-gray-800/50 rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-4 text-purple-300 border-b border-purple-800 pb-2">
              <Image className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Fotos Privadas</h3>
            </div>

            <div className="space-y-4">
              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {photo.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="flex items-center justify-center space-x-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg cursor-pointer transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span>Agregar Fotos</span>
                </label>
              </div>
            </div>
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
              disabled={loading || uploadingFiles}
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