import React, { useState } from 'react';
import { Share2, Copy, Check, ExternalLink } from 'lucide-react';

interface ShareButtonProps {
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    photos: string[];
    videos: string[];
    age: number;
    residence?: string;
    isAvailable?: boolean;
  };
  className?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ profile, className = '' }) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/profile/${profile.id}`;
  const shareTitle = `${profile.firstName} ${profile.lastName} - ${profile.age} años`;

  // Crear mensaje mejorado para todas las plataformas
  const createShareMessage = () => {
    const availabilityStatus = profile.isAvailable !== false 
      ? '😏 Disponible' 
      : '😔 No disponible';
    
    return `🔥 *${shareTitle}* 🔥\n\n` +
      `📍 ${profile.residence || 'Ubicación no especificada'}\n\n` +
      `${availabilityStatus}\n\n` +
      `👀 Ver perfil completo: ${shareUrl}`;
  };

  const handleCopyLink = async () => {
    try {
      const message = createShareMessage();
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share && 'share' in navigator) {
      try {
        const message = createShareMessage();
        await navigator.share({
          title: `🔥 ${shareTitle} 🔥`,
          text: message,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleWhatsAppShare = () => {
    const message = createShareMessage();
    const text = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleTelegramShare = () => {
    const message = createShareMessage();
    const text = encodeURIComponent(message);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`, '_blank');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowShareMenu(!showShareMenu)}
        className={`p-3 bg-black/80 hover:bg-black/90 backdrop-blur-sm border border-gray-600 hover:border-blue-500 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 group ${className}`}
        title="Compartir perfil"
      >
        <Share2 className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transition-colors" />
      </button>

      {showShareMenu && (
        <>
          {/* Overlay para cerrar el menú */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowShareMenu(false)}
          />
          
          {/* Menú de compartir */}
          <div className="absolute top-full right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white font-medium mb-1">Compartir perfil</h3>
              <p className="text-gray-400 text-sm">{shareTitle}</p>
            </div>

            <div className="p-2 space-y-1">
              {/* Copiar enlace */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span className="text-sm">
                  {copied ? 'Mensaje copiado' : 'Copiar mensaje'}
                </span>
              </button>

              {/* Compartir nativo (móviles) */}
              {('share' in navigator) && (
                <button
                  onClick={handleNativeShare}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm">Compartir</span>
                </button>
              )}

              {/* WhatsApp */}
              <button
                onClick={handleWhatsAppShare}
                className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-green-600/20 hover:border-green-500 rounded-lg transition-colors"
              >
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">W</span>
                </div>
                <span className="text-sm">WhatsApp</span>
              </button>

              {/* Telegram */}
              <button
                onClick={handleTelegramShare}
                className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-blue-600/20 hover:border-blue-500 rounded-lg transition-colors"
              >
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">T</span>
                </div>
                <span className="text-sm">Telegram</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};