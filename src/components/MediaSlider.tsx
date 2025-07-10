import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface MediaItem {
  url: string;
  type: 'photo' | 'video';
}

interface MediaSliderProps {
  media: MediaItem[];
  autoPlay?: boolean;
  interval?: number;
  onClose?: () => void;
  fullscreen?: boolean;
  blurImages?: boolean;
}

export const MediaSlider: React.FC<MediaSliderProps> = ({
  media,
  autoPlay = false,
  interval = 4000,
  onClose,
  fullscreen = false,
  blurImages = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!autoPlay || media.length <= 1) return;

    // Solo auto-avanzar si no es un video o si el video no se está reproduciendo
    const currentMedia = media[currentIndex];
    if (currentMedia?.type === 'video' && isVideoPlaying) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % media.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, media.length, currentIndex, isVideoPlaying]);

  const nextMedia = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
    setIsVideoPlaying(false);
  };

  const prevMedia = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
    setIsVideoPlaying(false);
  };

  const goToMedia = (index: number) => {
    setCurrentIndex(index);
    setIsVideoPlaying(false);
  };

  const toggleVideoPlay = () => {
    if (videoRef) {
      if (isVideoPlaying) {
        videoRef.pause();
      } else {
        videoRef.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const toggleVideoMute = () => {
    if (videoRef) {
      videoRef.muted = !isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  };

  if (media.length === 0) return null;

  const currentMedia = media[currentIndex];
  const containerClass = fullscreen
    ? "fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
    : "relative h-full";

  return (
    <div className={containerClass}>
      {fullscreen && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      <div className="relative w-full h-full flex items-center justify-center">
        {currentMedia.type === 'photo' ? (
          <img
            src={currentMedia.url}
            alt={`Imagen ${currentIndex + 1}`}
            className={`${fullscreen ? 'max-w-4xl max-h-[90vh]' : 'w-full h-full'} object-cover rounded-lg ${
              blurImages ? 'blur-xl' : ''
            }`}
          />
        ) : (
          <div className="relative">
            <video
              ref={setVideoRef}
              src={currentMedia.url}
              className={`${fullscreen ? 'max-w-4xl max-h-[90vh]' : 'w-full h-full'} object-cover rounded-lg ${
                blurImages ? 'blur-xl' : ''
              }`}
              muted={isVideoMuted}
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
              onEnded={() => setIsVideoPlaying(false)}
              controls={fullscreen}
            />
            
            {/* Video controls overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <div className="flex space-x-4">
                <button
                  onClick={toggleVideoPlay}
                  className="bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors"
                >
                  {isVideoPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6" />
                  )}
                </button>
                <button
                  onClick={toggleVideoMute}
                  className="bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors"
                >
                  {isVideoMuted ? (
                    <VolumeX className="w-6 h-6" />
                  ) : (
                    <Volume2 className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {media.length > 1 && (
          <>
            {/* Navigation buttons */}
            <button
              onClick={prevMedia}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={nextMedia}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Dots indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {media.map((item, index) => (
                <button
                  key={index}
                  onClick={() => goToMedia(index)}
                  className={`w-3 h-3 rounded-full transition-colors relative ${
                    index === currentIndex ? 'bg-red-500' : 'bg-white/50 hover:bg-white/70'
                  }`}
                >
                  {/* Indicador sutil para videos - solo un punto más pequeño */}
                  {item.type === 'video' && (
                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};