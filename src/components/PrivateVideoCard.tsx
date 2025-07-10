import React from 'react';
import { Play, Image, Calendar, User, Clock } from 'lucide-react';
import { PrivateVideoProfile } from '../types';
import { getTimeAgo } from '../utils/dateUtils';

interface PrivateVideoCardProps {
  profile: PrivateVideoProfile;
  onClick: () => void;
}

export const PrivateVideoCard: React.FC<PrivateVideoCardProps> = ({ 
  profile, 
  onClick 
}) => {
  const timeAgo = getTimeAgo(profile.createdAt);

  return (
    <div
      onClick={onClick}
      className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl overflow-hidden cursor-pointer transform transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-3xl hover:-translate-y-2 border border-gray-700 group relative"
    >
      {/* Header con icono de video privado */}
      <div className="relative h-48 bg-gradient-to-br from-purple-900 via-purple-800 to-red-900 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/30"></div>
        
        {/* Icono principal */}
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform duration-300">
            <Play className="w-8 h-8 text-white" />
          </div>
          <div className="bg-purple-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold">
            CONTENIDO PRIVADO
          </div>
        </div>

        {/* Badge de permisos */}
        <div className="absolute top-4 right-4">
          {profile.canUpload && (
            <div className="bg-green-600/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-bold">
              SUBIR
            </div>
          )}
        </div>

        {/* Información del perfil en la parte inferior */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <h3 className="text-xl font-bold text-white mb-1">
            {profile.name}
          </h3>
          {profile.mainProfile && (
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-blue-300 text-sm">
                Relacionado con {profile.mainProfile.name}
              </span>
            </div>
          )}
          {profile.description && (
            <p className="text-gray-300 text-sm line-clamp-2">
              {profile.description}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Estadísticas principales */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Play className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-white font-medium">{profile.videosCount}</div>
            <div className="text-gray-400 text-xs">Videos</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Image className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-white font-medium">{profile.photosCount}</div>
            <div className="text-gray-400 text-xs">Fotos</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-white font-medium">{profile.totalDurationMinutes}</div>
            <div className="text-gray-400 text-xs">Min</div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="space-y-2">
          {/* Tamaño del cuerpo */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Tamaño:</span>
            <span className="text-white font-medium bg-gray-700/50 px-2 py-1 rounded">
              {profile.bodySize}
            </span>
          </div>

          {/* Perfil relacionado */}
          {profile.mainProfile && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Perfil base:</span>
              <div className="text-right">
                <div className="text-blue-300 font-medium">{profile.mainProfile.name}</div>
                <div className="text-gray-400 text-xs">
                  {profile.mainProfile.age} años
                  {profile.mainProfile.residence && ` • ${profile.mainProfile.residence}`}
                </div>
              </div>
            </div>
          )}

          {/* Creado por */}
          {profile.createdBy && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Creado por:</span>
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3 text-blue-400" />
                <span className="text-blue-300">@{profile.createdBy.username}</span>
              </div>
            </div>
          )}

          {/* Fecha de creación */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Creado:</span>
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-gray-400" />
              <span className="text-gray-300">{timeAgo}</span>
            </div>
          </div>
        </div>

        {/* Indicador de acceso */}
        <div className="pt-2 border-t border-gray-700">
          <div className="flex items-center justify-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-300 font-medium">Acceso Autorizado</span>
          </div>
        </div>
      </div>
    </div>
  );
};