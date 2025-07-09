import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Heart, 
  MapPin, 
  Calendar, 
  Instagram, 
  DollarSign,
  Briefcase,
  Home,
  User,
  Music,
  MapPin as Location,
  Grid3X3,
  Edit,
  Trash2,
  Clock,
  Users,
  ThumbsUp
} from 'lucide-react';
import { Profile } from '../types';
import { MediaSlider } from './MediaSlider';
import { ShareButton } from './ShareButton';
import { getTimeAgo } from '../utils/dateUtils';

interface ProfileDetailProps {
  profile: Profile;
  onBack: () => void;
  onEdit?: (profile: Profile) => void;
  onDelete?: (profile: Profile) => void;
}

export const ProfileDetail: React.FC<ProfileDetailProps> = ({ 
  profile, 
  onBack, 
  onEdit, 
  onDelete 
}) => {
  const [showFullscreenSlider, setShowFullscreenSlider] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  // Combinar fotos y videos en un solo array de media
  const allMedia = [
    ...profile.photos.map(url => ({ url, type: 'photo' as const })),
    ...profile.videos.map(url => ({ url, type: 'video' as const }))
  ];

  const handleMediaClick = (index: number) => {
    setSelectedMediaIndex(index);
    setShowFullscreenSlider(true);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-red-900/20">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <Grid3X3 className="w-4 h-4" />
              <span>Volver al catálogo</span>
            </button>

            {/* Action buttons - Solo iconos con fondo negro elegante */}
            <div className="flex items-center space-x-3">
              <ShareButton 
                profile={{
                  id: profile.id,
                  firstName: profile.firstName,
                  lastName: profile.lastName,
                  photos: profile.photos,
                  videos: profile.videos,
                  age: profile.age,
                  residence: profile.residence
                }}
              />
              {onEdit && (
                <button
                  onClick={handleEditClick}
                  className="p-3 bg-black/80 hover:bg-black/90 backdrop-blur-sm border border-gray-600 hover:border-gray-500 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 group"
                  title="Editar perfil"
                >
                  <Edit className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDeleteClick}
                  className="p-3 bg-black/80 hover:bg-black/90 backdrop-blur-sm border border-gray-600 hover:border-red-500 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 group"
                  title="Eliminar perfil"
                >
                  <Trash2 className="w-5 h-5 text-gray-300 group-hover:text-red-400 transition-colors" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Media Section */}
          <div className="space-y-4">
            {/* Main media on mobile, hidden on desktop */}
            <div className="lg:hidden">
              <div className="aspect-[2/3] rounded-2xl overflow-hidden">
                <MediaSlider
                  media={allMedia}
                  autoPlay={false}
                />
              </div>
            </div>


            {/* Auto-sliding media on desktop */}
            <div className="hidden lg:block h-[600px] rounded-2xl overflow-hidden">
              <MediaSlider
                media={allMedia}
                autoPlay={true}
                interval={4000}
              />
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  <div className="flex items-center space-x-4 text-gray-300">
                    <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
                      profile.isAvailable !== false
                        ? 'bg-green-600/20 text-green-300 border border-green-600/30'
                        : 'bg-red-600/20 text-red-300 border border-red-600/30'
                    }`}>
                      <span className="text-lg">
                        {profile.isAvailable !== false ? '😏' : '😔'}
                      </span>
                      <span>
                        {profile.isAvailable !== false ? 'Disponible' : 'No disponible'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{profile.age} años</span>
                    </div>
                    {profile.residence && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{profile.residence}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Heart className="w-8 h-8 text-red-400 fill-current animate-pulse" />
              </div>

              {/* Media count and creation date */}
              <div className="flex items-center justify-between mb-4 text-gray-400 text-sm">
                <div className="flex items-center space-x-4">
                  <span>{profile.photos.length} fotos • {profile.videos.length} videos</span>
                  <div className="flex items-center space-x-1 text-red-400">
                    <Heart className="w-4 h-4 fill-current" />
                    <span className="font-medium">{profile.likesCount}</span>
                    <span>me gusta</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {profile.createdByUser && (
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>Por @{profile.createdByUser.username}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>Creado {timeAgo}</span>
                  </div>
                </div>
              </div>

              {profile.instagram && (
                <a
                  href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-700 hover:to-purple-700 transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                  <span>{profile.instagram}</span>
                </a>
              )}
            </div>

            {/* Economic Situation */}
            {(profile.netSalary || profile.fatherJob || profile.motherJob) && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-red-300 mb-4 flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Situación Económica</span>
                </h3>
                <div className="space-y-3">
                  {profile.netSalary && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Salario neto:</span>
                      <span className="text-white font-medium flex items-center space-x-1">
                        <span className="text-green-400">RD$</span>
                        <span>{profile.netSalary.replace('RD$', '').trim()}</span>
                      </span>
                    </div>
                  )}
                  {profile.fatherJob && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Trabajo del padre:</span>
                      <span className="text-white font-medium">{profile.fatherJob}</span>
                    </div>
                  )}
                  {profile.motherJob && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Trabajo de la madre:</span>
                      <span className="text-white font-medium">{profile.motherJob}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Physical Characteristics */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-red-300 mb-4 flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Características Físicas</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/30 rounded-lg p-3">
                  <div className="text-gray-400 text-sm">Altura</div>
                  <div className="text-white font-medium">{profile.height}</div>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-3">
                  <div className="text-gray-400 text-sm">Cuerpo</div>
                  <div className="text-white font-medium">{profile.bodySize}</div>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-3">
                  <div className="text-gray-400 text-sm">Busto</div>
                  <div className="text-white font-medium">{profile.bustSize}</div>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-3">
                  <div className="text-gray-400 text-sm">Piel</div>
                  <div className="text-white font-medium">{profile.skinColor}</div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-red-300 mb-4 flex items-center space-x-2">
                <Home className="w-5 h-5" />
                <span>Ubicación</span>
              </h3>
              <div className="space-y-3">
                {profile.nationality && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Nacionalidad:</span>
                    <span className="text-white font-medium">{profile.nationality}</span>
                  </div>
                )}
                {profile.residence && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Residencia:</span>
                    <span className="text-white font-medium">{profile.residence}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Vive:</span>
                  <span className="text-white font-medium">{profile.livingWith}</span>
                </div>
              </div>
            </div>

            {/* Gustos e Intereses */}
            {(profile.musicTags.length > 0 || profile.placeTags.length > 0) && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-red-300 mb-6 flex items-center space-x-2">
                  <Heart className="w-5 h-5 fill-current" />
                  <span>Gustos Personales</span>
                </h3>
                
                <div className="space-y-6">
                  {/* Music Tags */}
                  {profile.musicTags.length > 0 && (
                    <div>
                      <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                        <Music className="w-4 h-4 text-red-400" />
                        <span>Música Favorita</span>
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.musicTags.map((tag, index) => (
                          <span
                            key={index}
                            className="bg-gradient-to-r from-red-800/40 to-red-700/40 text-red-200 px-3 py-2 rounded-full text-sm border border-red-700/30 backdrop-blur-sm"
                          >
                            🎵 {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Place Tags */}
                  {profile.placeTags.length > 0 && (
                    <div>
                      <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                        <Location className="w-4 h-4 text-red-400" />
                        <span>Lugares Favoritos</span>
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.placeTags.map((tag, index) => (
                          <span
                            key={index}
                            className="bg-gradient-to-r from-purple-800/40 to-purple-700/40 text-purple-200 px-3 py-2 rounded-full text-sm border border-purple-700/30 backdrop-blur-sm"
                          >
                            📍 {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sección de Me Gusta */}
            {profile.likesCount > 0 && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-red-300 mb-4 flex items-center space-x-2">
                  <ThumbsUp className="w-5 h-5" />
                  <span>Me Gusta ({profile.likesCount})</span>
                </h3>
                
                {profile.likedByUsers.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {profile.likedByUsers.slice(0, 6).map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center space-x-3 bg-gray-700/30 rounded-lg p-3"
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {user.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium truncate">
                              {user.fullName}
                            </div>
                            <div className="text-gray-400 text-sm">
                              @{user.username}
                            </div>
                          </div>
                          {user.role === 'admin' && (
                            <div className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded text-xs">
                              Admin
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {profile.likedByUsers.length > 6 && (
                      <div className="text-center">
                        <div className="text-gray-400 text-sm">
                          Y {profile.likedByUsers.length - 6} personas más...
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">
                      Los usuarios que dieron me gusta aparecerán aquí
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Media Slider */}
      {showFullscreenSlider && (
        <MediaSlider
          media={allMedia}
          onClose={() => setShowFullscreenSlider(false)}
          fullscreen={true}
        />
      )}
    </div>
  );
};