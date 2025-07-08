import React from 'react';
import { Heart } from 'lucide-react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Heart className="w-12 h-12 text-red-400 fill-current animate-pulse mx-auto mb-4" />
        <p className="text-white text-lg">Cargando perfiles...</p>
        <div className="mt-4 flex space-x-1 justify-center">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};