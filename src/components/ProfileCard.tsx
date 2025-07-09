import React from 'react';
import { Heart, MapPin, Calendar, Instagram, Play } from 'lucide-react';
import { Profile } from '../types';
import { getTimeAgo, isNewProfile } from '../utils/dateUtils';

interface ProfileCardProps {
  profile: Profile;
  onClick: () => void;
  onToggleLike: (id: string) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ 
  profile, 
  onClick, 
  onToggleLike
}) => {
  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
      className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-3xl border border-gray-700 group relative"
    >
      {/* Media */}
      <div className="relative h-80 overflow-hidden">
        {firstMedia ? (
          <>
            {firstMedia.type === 'photo' ? (
              <img
                src={firstMedia.url}
                alt={`${profile.firstName} ${profile.lastName}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="relative w-full h-full">
                <video
                  src={firstMedia.url}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
          {/* Badge NUEVO */}
          {isNew && (
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
              NUEVO
            </div>
          )}
          
          {/* Age badge */}
          <div className="bg-red-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{profile.age} años</span>
          </div>
        </div>
        
        {/* Media count badge - solo si hay más de 1 archivo */}
        {totalMedia > 1 && (
          <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
            +{totalMedia - 1}
          </div>
        )}
        
        {/* Favorite button */}
        <div className="absolute top-4 left-4" style={{ marginTop: totalMedia > 1 ? '2.5rem' : '0' }}>
          <button
            onClick={handleLikeClick}
            className={`p-2 rounded-full backdrop-blur-sm transition-all duration-300 relative group ${
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
            
            {/* Tooltip con información de likes */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {profile.likesCount === 0 ? 'Sin me gusta' : 
               profile.likesCount === 1 ? '1 me gusta' : 
               `${profile.likesCount} me gusta`}
            </div>
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
      <div className="p-6 space-y-4">
        {/* Quick info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-gray-400">Altura</div>
            <div className="text-white font-medium">{profile.height}</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-gray-400">Cuerpo</div>
            <div className="text-white font-medium">{profile.bodySize}</div>
          </div>
        </div>

        {/* Tags preview */}
        {profile.musicTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.musicTags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="bg-red-800/30 text-red-300 px-2 py-1 rounded-full text-xs"
              >
                🎵 {tag}
              </span>
            ))}
            {profile.musicTags.length > 3 && (
              <span className="text-gray-400 text-xs">
                +{profile.musicTags.length - 3} más
              </span>
            )}
          </div>
        )}

        {/* Instagram y información del creador */}
        <div className="space-y-2">
          {profile.instagram && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-pink-400 text-sm">
                <Instagram className="w-4 h-4" />
                <span>{profile.instagram}</span>
              </div>
              
              {/* Badge de Disponibilidad */}
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                profile.isAvailable !== false
                  ? 'bg-green-600/20 text-green-300 border border-green-600/30'
                  : 'bg-red-600/20 text-red-300 border border-red-600/30'
              }`}>
                <span className="text-sm">
                  {profile.isAvailable !== false ? '😏' : '😔'}
                </span>
              </div>
            </div>
          )}
          
          {/* Creado por usuario */}
          {profile.createdByUser && (
            <div className="flex items-center justify-between text-xs">
              <div className="text-gray-400">
                Creado por: <span className="text-blue-300">@{profile.createdByUser.username}</span>
              </div>
              {!profile.instagram && (
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                  profile.isAvailable !== false
                    ? 'bg-green-600/20 text-green-300 border border-green-600/30'
                    : 'bg-red-600/20 text-red-300 border border-red-600/30'
                }`}>
                  <span className="text-sm">
                    {profile.isAvailable !== false ? '😏' : '😔'}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Si no hay Instagram ni usuario creador, mostrar solo disponibilidad */}
          {!profile.instagram && !profile.createdByUser && (
            <div className="flex justify-end">
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                profile.isAvailable !== false
                  ? 'bg-green-600/20 text-green-300 border border-green-600/30'
                  : 'bg-red-600/20 text-red-300 border border-red-600/30'
              }`}>
                <span className="text-sm">
                  {profile.isAvailable !== false ? '😏' : '😔'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};