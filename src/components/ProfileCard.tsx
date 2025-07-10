import React from 'react';
import { Heart, MapPin, Calendar, Instagram, Play } from 'lucide-react';
import { Profile } from '../types';
import { getTimeAgo, isNewProfile } from '../utils/dateUtils';

interface ProfileCardProps {
  profile: Profile;
  onClick: () => void;
  onToggleLike: (id: string) => void;
  blurImages?: boolean;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ 
  profile, 
  onClick, 
  onToggleLike,
  blurImages = false
}) => {
  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('ProfileCard: Click en like, perfil:', profile.id, 'isLiked:', profile.isLikedByCurrentUser);
    onToggleLike(profile.id);
  };

  // Obtener el primer archivo de media (foto o video)
  const firstMedia = profile.photos.length > 0 
    ? { url: profile.photos[0], type: 'photo' as const }
    : profile.videos.length > 0 
    ? { url: profile.videos[0], type: 'video' as const }
    : null;

  const totalMedia = profile.photos.length + profile.videos.length;
  const timeAgo = getTimeAgo(profile.createdAt);
  const isNew = isNewProfile(profile.createdAt);

  return (
    <div
      onClick={onClick}
      className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl overflow-hidden cursor-pointer transform transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-3xl hover:-translate-y-2 border border-gray-700 group relative"
    >
      {/* Media */}
      <div className="relative h-96 sm:h-72 md:h-80 overflow-hidden">
        {firstMedia ? (
          <>
            {firstMedia.type === 'photo' ? (
              <img
                src={firstMedia.url}
                alt={`${profile.firstName} ${profile.lastName}`}
                className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${
                  blurImages ? 'blur-xl' : ''
                }`}
              />
            ) : (
              <div className="relative w-full h-full">
                <video
                  src={firstMedia.url}
                  className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${
                    blurImages ? 'blur-xl' : ''
                  }`}
                  muted
                  preload="metadata"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Play className="w-12 h-12 text-white" />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
            <Heart className="w-16 h-16 text-gray-500" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
        
        {/* Badges superiores */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          {/* Age badge */}
          <div className="bg-red-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{profile.age} años</span>
          </div>
          
          {/* Badge NUEVO */}
          {isNew && (
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
              NUEVO
            </div>
          )}
        </div>
        
        {/* Media count badge - solo si hay más de 1 archivo */}
        
        {/* Favorite button */}
        <div className="absolute top-4 left-4">
          <button
            onClick={handleLikeClick}
            className={`p-2 rounded-full backdrop-blur-sm transition-all duration-300 relative ${
              profile.isLikedByCurrentUser 
                ? 'bg-red-600/90 text-white' 
                : 'bg-black/50 text-gray-300 hover:bg-red-600/70 hover:text-white'
            }`}
          >
            <Heart className={`w-5 h-5 ${profile.isLikedByCurrentUser ? 'fill-current' : ''}`} />
            
            {/* Contador de likes */}
            {profile.likesCount > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 font-bold shadow-lg">
                {profile.likesCount > 99 ? '99+' : profile.likesCount}
              </div>
            )}
          </button>
        </div>

        {/* Name overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-xl font-bold text-white mb-1">
            {profile.firstName} {profile.lastName}
          </h3>
          {profile.residence && (
            <div className="flex items-center space-x-2 text-gray-300 text-sm">
              <MapPin className="w-4 h-4" />
              <span>{profile.residence}</span>
            </div>
          )}
        </div>

        {/* Fecha de creación */}
        <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
          {timeAgo}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 md:p-6 space-y-2 sm:space-y-3 md:space-y-4">
        {/* Quick info */}
        <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-4 text-sm">
          <div className="bg-gray-800/50 rounded-lg p-1.5 sm:p-2 md:p-3">
            <div className="text-gray-400 text-xs leading-tight">Altura</div>
            <div className="text-white font-medium text-xs leading-tight truncate">{profile.height}</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-1.5 sm:p-2 md:p-3">
            <div className="text-gray-400 text-xs leading-tight">Culo</div>
            <div className="text-white font-medium text-xs leading-tight truncate">{profile.bodySize}</div>
          </div>
           <div className="bg-gray-800/50 rounded-lg p-1.5 sm:p-2 md:p-3">
            <div className="text-gray-400 text-xs leading-tight">Teta</div>
            <div className="text-white font-medium text-xs leading-tight truncate">{profile.bustSize}</div>
          </div>
        </div>

        {/* Tags preview */}
        {profile.musicTags.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-2 min-h-0">
            {profile.musicTags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="bg-red-800/30 text-red-300 px-2 py-0.5 rounded-full text-xs leading-tight truncate max-w-[80px] sm:max-w-none"
                title={tag}
              >
                🎵 {tag}
              </span>
            ))}
            {profile.musicTags.length > 3 && (
              <span className="text-gray-400 text-xs leading-tight">
                +{profile.musicTags.length - 3} más
              </span>
            )}
          </div>
        )}

        {/* Instagram y información del creador */}
        <div className="space-y-1.5 sm:space-y-2">
          {profile.instagram && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-1 text-pink-400 text-xs sm:text-sm min-w-0 flex-1">
                <Instagram className="w-4 h-4" />
                <span className="truncate">{profile.instagram}</span>
              </div>
              
              {/* Badge de Disponibilidad */}
              <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                profile.isAvailable !== false
                  ? 'bg-green-600/20 text-green-300 border border-green-600/30'
                  : 'bg-red-600/20 text-red-300 border border-red-600/30'
              }`}>
                <span className="text-xs">
                  {profile.isAvailable !== false ? '😏' : '😔'}
                </span>
                <span className="hidden sm:inline">
                  {profile.isAvailable !== false ? 'Disponible' : 'No disponible'}
                </span>
                <span className="sm:hidden">
                  {profile.isAvailable !== false ? 'Disp.' : 'N/D'}
                </span>
              </div>
            </div>
          )}
          
          {/* Creado por usuario */}
          {profile.createdByUser && (
            <div className="flex items-center justify-between text-xs gap-2">
              <div className="text-gray-400 min-w-0 flex-1">
                <span className="hidden sm:inline">Creado por: </span>
                <span className="text-blue-300 truncate">@{profile.createdByUser?.username || 'Usuario'}</span>
              </div>
              {!profile.instagram && (
                <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                  profile.isAvailable !== false
                    ? 'bg-green-600/20 text-green-300 border border-green-600/30'
                    : 'bg-red-600/20 text-red-300 border border-red-600/30'
                }`}>
                  <span className="text-xs">
                    {profile.isAvailable !== false ? '😏' : '😔'}
                  </span>
                  <span className="hidden sm:inline">
                    {profile.isAvailable !== false ? 'Disponible' : 'No disponible'}
                  </span>
                  <span className="sm:hidden">
                    {profile.isAvailable !== false ? 'Disp.' : 'N/D'}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Si no hay Instagram ni usuario creador, mostrar solo disponibilidad */}
          {!profile.instagram && !profile.createdByUser && (
            <div className="flex justify-center sm:justify-end">
              <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                profile.isAvailable !== false
                  ? 'bg-green-600/20 text-green-300 border border-green-600/30'
                  : 'bg-red-600/20 text-red-300 border border-red-600/30'
              }`}>
                <span className="text-xs">
                  {profile.isAvailable !== false ? '😏' : '😔'}
                </span>
                <span className="hidden sm:inline">
                  {profile.isAvailable !== false ? 'Disponible' : 'No disponible'}
                </span>
                <span className="sm:hidden">
                  {profile.isAvailable !== false ? 'Disp.' : 'N/D'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};