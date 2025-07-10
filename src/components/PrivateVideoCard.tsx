import React from 'react';
import { PrivateVideoProfile } from '../types';
import { getTimeAgo } from '../utils/dateUtils';

interface PrivateVideoCardProps {
  profile: PrivateVideoProfile;
  onClick: () => void;
}

export const PrivateVideoCard: React.FC<PrivateVideoCardProps> = ({ profile, onClick }) => {
  const timeAgo = getTimeAgo(new Date(profile.createdAt));

  return (
    <div
      onClick={onClick}
      className="bg-gray-900 rounded-xl shadow-md p-4 cursor-pointer border border-gray-700 hover:border-purple-600 transition-colors"
    >
      {/* Perfil base o anónimo */}
      {profile.mainProfile ? (
        <div className="mb-2">
          <div className="text-sm text-gray-400">Perfil base</div>
          <div className="font-semibold text-white">{profile.mainProfile.name}</div>
          <div className="text-xs text-gray-500">
            {profile.mainProfile.age} años
            {profile.mainProfile.residence && ` • ${profile.mainProfile.residence}`}
          </div>
        </div>
      ) : (
        <div className="mb-2">
          <div className="text-sm text-gray-400">Perfil anónimo</div>
          <div className="font-semibold text-white">{profile.name}</div>
          <div className="text-xs text-gray-500">Sin información del catálogo principal</div>
        </div>
      )}

      {/* Medidas corporales */}
      <div className="mb-2 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Altura:</span>
          <span className="text-purple-300 font-medium">{profile.height}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Cuerpo:</span>
          <span className="text-purple-300 font-medium">{profile.bodySize}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Busto:</span>
          <span className="text-purple-300 font-medium">{profile.bustSize}</span>
        </div>
      </div>

      {/* Creado por */}
      {profile.createdBy && (
        <div className="mb-2 flex items-center gap-1">
          <span className="text-sm text-gray-400">Creado por:</span>
          <span className="text-sm text-blue-300 font-medium">@{profile.createdBy.username}</span>
        </div>
      )}

      {/* Fecha de creación */}
      <div className="mb-2 text-sm text-gray-400">
        Creado: <span className="text-gray-300">{timeAgo}</span>
      </div>

      {/* Número de fotos y videos */}
      <div className="flex gap-4 mt-4">
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-white">{profile.videosCount}</span>
          <span className="text-xs text-gray-400">Videos</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-white">{profile.photosCount}</span>
          <span className="text-xs text-gray-400">Fotos</span>
        </div>
      </div>
    </div>
  );
};