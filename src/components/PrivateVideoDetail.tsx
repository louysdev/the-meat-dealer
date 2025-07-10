import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Image, Shield, User, Calendar, Settings, Edit, Trash2, Camera } from 'lucide-react';
import { PrivateVideoProfile, PrivateVideo, PrivatePhoto, User as UserType } from '../types';
import { getPrivateProfileMedia } from '../services/privateVideoService';
import { MediaSlider } from './MediaSlider';
import { PrivateVideoComments } from './PrivateVideoComments';
import { getTimeAgo } from '../utils/dateUtils';

interface PrivateVideoDetailProps {
  profile: PrivateVideoProfile;
  currentUser: UserType | null;
  onBack: () => void;
  onEdit?: (profile: PrivateVideoProfile) => void;
  onDelete?: (profile: PrivateVideoProfile) => void;
  onManageAccess?: () => void;
}

export const PrivateVideoDetail: React.FC<PrivateVideoDetailProps> = ({
  profile,
  currentUser,
  onBack,
  onEdit,
  onDelete,
  onManageAccess
}) => {
  const [videos, setVideos] = useState<PrivateVideo[]>([]);
  const [photos, setPhotos] = useState<PrivatePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullscreenSlider, setShowFullscreenSlider] = useState(false);

  useEffect(() => {
    loadMedia();
  }, [profile.id, currentUser?.id]);

  // Verificar permisos de edición/eliminación
  const canEdit = () => {
    if (!currentUser) return false;
    
    // Los administradores pueden editar cualquier perfil
    if (currentUser.role === 'admin') return true;
    
    // Los usuarios solo pueden editar perfiles que ellos crearon
    if (profile.createdBy?.id === currentUser.id) return true;
    
    return false;
  };

  const loadMedia = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const media = await getPrivateProfileMedia(profile.id, currentUser?.id);
      setVideos(media.videos);
      setPhotos(media.photos);
      
    } catch (err) {
      console.error('Error cargando media:', err);
      setError(err instanceof Error ? err.message : 'Error cargando contenido');
    } finally {
      setLoading(false);
    }
  };

  // Combinar videos y fotos para el slider
  const allMedia = [
    ...photos.map(photo => ({ url: photo.photoUrl, type: 'photo' as const })),
    ...videos.map(video => ({ url: video.videoUrl, type: 'video' as const }))
  ];

  // Arrays separados para cada tipo de media
  const videoMedia = videos.map(video => ({ url: video.videoUrl, type: 'video' as const }));
  const photoMedia = photos.map(photo => ({ url: photo.photoUrl, type: 'photo' as const }));

  const [currentMediaType, setCurrentMediaType] = useState<'all' | 'video' | 'photo'>('all');

  const handleMediaClick = (mediaType: 'video' | 'photo') => {
    setCurrentMediaType(mediaType);
    setShowFullscreenSlider(true);
  };

  // Seleccionar el media array según el tipo actual
  const getCurrentMedia = () => {
    switch (currentMediaType) {
      case 'video':
        return videoMedia;
      case 'photo':
        return photoMedia;
      default:
        return allMedia;
    }
  };

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(profile);
    }
  };

  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete(profile);
    }
  };

  const timeAgo = getTimeAgo(profile.createdAt);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando contenido privado...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900/20 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Acceso Denegado</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={onBack}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900/20">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver a Videos Privados</span>
            </button>

            {/* Action buttons */}
            <div className="flex items-center space-x-3">
              {onEdit && canEdit() && (
                <button
                  onClick={handleEditClick}
                  className="p-3 bg-black/80 hover:bg-black/90 backdrop-blur-sm border border-gray-600 hover:border-gray-500 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 group"
                  title="Editar perfil"
                >
                  <Edit className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />
                </button>
              )}
              {onDelete && canEdit() && (
                <button
                  onClick={handleDeleteClick}
                  className="p-3 bg-black/80 hover:bg-black/90 backdrop-blur-sm border border-gray-600 hover:border-red-500 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 group"
                  title="Eliminar perfil"
                >
                  <Trash2 className="w-5 h-5 text-gray-300 group-hover:text-red-400 transition-colors" />
                </button>
              )}
              {currentUser?.role === 'admin' && onManageAccess && (
                <button
                  onClick={onManageAccess}
                  className="p-3 bg-black/80 hover:bg-black/90 backdrop-blur-sm border border-gray-600 hover:border-purple-500 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 group"
                  title="Gestionar accesos"
                >
                  <Settings className="w-5 h-5 text-gray-300 group-hover:text-purple-400 transition-colors" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Media Section */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <Image className="w-5 h-5 text-purple-400" />
                <span>Galería</span>
              </h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {/* Lista de videos */}
                {videos.length > 0 && (
                  <div>
                    <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                      <Play className="w-4 h-4 text-purple-400" />
                      <span>Videos</span>
                    </h4>
                    <div className="space-y-2">
                      {videos.map((video) => (
                        <div
                          key={video.id}
                          onClick={() => handleMediaClick('video')}
                          className="flex items-center justify-between bg-gray-700/30 rounded-lg p-3 hover:bg-gray-700/50 transition-colors cursor-pointer"
                        >
                          <div className="flex-1">
                            <div className="text-white font-medium">{video.title}</div>
                            <div className="text-gray-400 text-xs">
                              {video.fileSizeMb && `${video.fileSizeMb.toFixed(1)} MB`}
                            </div>
                          </div>
                          <Play className="w-5 h-5 text-purple-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lista de fotos */}
                {photos.length > 0 && (
                  <div>
                    <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                      <Image className="w-4 h-4 text-blue-400" />
                      <span>Fotos</span>
                    </h4>
                    <div className="space-y-2">
                      {photos.map((photo, index) => (
                        <div
                          key={photo.id}
                          onClick={() => handleMediaClick('photo')}
                          className="flex items-center justify-between bg-gray-700/30 rounded-lg p-3 hover:bg-gray-700/50 transition-colors cursor-pointer"
                        >
                          <div className="flex-1">
                            <div className="text-white font-medium">Foto {index + 1}</div>
                          </div>
                          <Image className="w-5 h-5 text-blue-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {allMedia.length === 0 && (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No hay contenido disponible</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <Shield className="w-6 h-6 text-purple-400" />
                    <span className="bg-purple-600/20 text-purple-300 px-3 py-1 rounded-full text-sm font-medium">
                      CONTENIDO PRIVADO
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {profile.name}
                  </h1>
                  {profile.description && (
                    <p className="text-gray-300 leading-relaxed">
                      {profile.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Media count */}
              <div className="flex items-center space-x-1 mb-4 text-gray-400 text-sm">
                <Camera className="w-4 h-4" />
                <span>
                  {photos.length} fotos • {videos.length} videos
                </span>
              </div>


              {/* Additional Info */}
              <div className="space-y-3 pt-4 border-t border-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-400">Altura:</span>
                  <span className="text-white font-medium bg-gray-700/50 px-2 py-1 rounded">
                    {profile.height}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Tamaño del cuerpo:</span>
                  <span className="text-white font-medium bg-gray-700/50 px-2 py-1 rounded">
                    {profile.bodySize}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Tamaño del busto:</span>
                  <span className="text-white font-medium bg-gray-700/50 px-2 py-1 rounded">
                    {profile.bustSize}
                  </span>
                </div>

                {profile.createdBy && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Creado por:</span>
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-300">@{profile.createdBy.username}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-400">Fecha de creación:</span>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">{timeAgo}</span>
                  </div>
                </div>

                {/* Access Status */}
                <div className="flex justify-between">
                  <span className="text-gray-400">Tu acceso:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-300 text-sm">
                      {profile.canUpload ? 'Ver y Subir' : 'Solo Ver'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-8">
          <div className="bg-gray-800/50 rounded-xl border border-gray-700">
            <div className="p-6">
              <PrivateVideoComments
                profileId={profile.id}
                currentUser={currentUser}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Media Slider */}
      {showFullscreenSlider && (
        <MediaSlider
          media={getCurrentMedia()}
          onClose={() => {
            setShowFullscreenSlider(false);
            setCurrentMediaType('all');
          }}
          fullscreen={true}
          blurImages={false}
        />
      )}
    </div>
  );
};