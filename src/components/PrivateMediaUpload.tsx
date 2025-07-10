import React, { useRef, useState } from 'react';
import { Camera, Video, Play, Trash2, AlertCircle } from 'lucide-react';
import { uploadPrivateVideo, uploadPrivatePhoto, deletePrivatePhoto, deletePrivateVideo } from '../services/privateVideoService';
import { resizeImage, base64ToFile } from '../utils/imageUtils';
import { PrivateVideo, PrivatePhoto } from '../types';

interface PrivateMediaUploadProps {
  profileId: string;
  photos: PrivatePhoto[];
  videos: PrivateVideo[];
  onMediaChange: () => void; // Callback para recargar la lista
  currentUserId: string;
  maxItems?: number;
}

export const PrivateMediaUpload: React.FC<PrivateMediaUploadProps> = ({
  profileId,
  photos,
  videos,
  onMediaChange,
  currentUserId,
  maxItems = 12
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalMedia = photos.length + videos.length;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length + totalMedia > maxItems) {
      setError(`Solo puedes subir máximo ${maxItems} archivos (fotos y videos)`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          // Subir foto
          const resizedImage = await resizeImage(file);
          const resizedFile = base64ToFile(resizedImage, file.name);
          
          await uploadPrivatePhoto({
            profileId,
            photoFile: resizedFile
          }, currentUserId);
        } else if (file.type.startsWith('video/')) {
          // Subir video
          await uploadPrivateVideo({
            profileId,
            title: `Video ${videos.length + 1}`,
            videoFile: file
          }, currentUserId);
        }
      }
      
      // Recargar la lista
      onMediaChange();
    } catch (error: any) {
      console.error('Error subiendo archivos:', error);
      setError(error.message || 'Error subiendo archivos');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    setDeleting(photoId);
    setError(null);
    
    try {
      await deletePrivatePhoto(photoId);
      onMediaChange();
    } catch (error: any) {
      console.error('Error eliminando foto:', error);
      setError(error.message || 'Error eliminando foto');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    setDeleting(videoId);
    setError(null);
    
    try {
      await deletePrivateVideo(videoId);
      onMediaChange();
    } catch (error: any) {
      console.error('Error eliminando video:', error);
      setError(error.message || 'Error eliminando video');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-300">
          Fotos y Videos Privados (máximo {maxItems})
        </label>
        <span className="text-xs text-gray-400">
          {totalMedia}/{maxItems}
        </span>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-red-300 text-sm">{error}</span>
        </div>
      )}

      {/* Upload button */}
      {totalMedia < maxItems && (
        <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-gray-600 transition-colors">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex flex-col items-center space-y-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 w-full"
          >
            <div className="flex space-x-2 mb-2">
              <Camera className="w-6 h-6" />
              <Video className="w-6 h-6" />
            </div>
            <span className="text-sm">
              {uploading ? 'Subiendo...' : 'Agregar foto o video'}
            </span>
            <span className="text-xs text-gray-500">
              JPG, PNG, MP4, MOV - Máximo 50MB por archivo
            </span>
          </button>
        </div>
      )}

      {/* Media grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Photos */}
        {photos.map((photo) => (
          <div key={`photo-${photo.id}`} className="relative group aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
            <img
              src={photo.photoUrl}
              alt={`Foto privada ${photo.photoOrder}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div class="w-full h-full flex flex-col items-center justify-center text-gray-400 text-xs p-2 bg-gray-700/50">
                      <div class="w-8 h-8 mb-1">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>
                        </svg>
                      </div>
                      <span class="text-center">Error cargando imagen</span>
                    </div>
                  `;
                }
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => handleDeletePhoto(photo.id)}
                disabled={deleting === photo.id}
                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors disabled:opacity-50"
              >
                {deleting === photo.id ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
              #{photo.photoOrder}
            </div>
          </div>
        ))}

        {/* Videos */}
        {videos.map((video, videoIndex) => (
          <div key={`video-${video.id}`} className="relative group aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
            {video.thumbnailUrl ? (
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            ) : video.videoUrl ? (
              <div className="relative w-full h-full">
                <video
                  src={video.videoUrl}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                  <Play className="w-8 h-8 text-white" />
                </div>
              </div>
            ) : (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                <Video className="w-12 h-12 text-gray-400" />
              </div>
            )}
            
            {/* Video badge */}
            <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
              VIDEO
            </div>
            
            {/* Duration badge */}
            {video.durationSeconds && (
              <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                {Math.floor(video.durationSeconds / 60)}:{(video.durationSeconds % 60).toString().padStart(2, '0')}
              </div>
            )}
            
            {/* Delete button on hover */}
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => handleDeleteVideo(video.id)}
                disabled={deleting === video.id}
                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors disabled:opacity-50"
              >
                {deleting === video.id ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
            
            {/* Video number */}
            <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
              #{photos.length + videoIndex + 1}
            </div>
          </div>
        ))}
      </div>

      {/* Help text */}
      <div className="text-sm text-gray-400 space-y-1">
        <p>• Formatos soportados: JPG, PNG, GIF para fotos | MP4, MOV, AVI para videos</p>
        <p>• Tamaño máximo recomendado: 50MB por archivo</p>
        <p>• Los archivos se suben de forma segura al storage privado</p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {totalMedia === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No hay fotos o videos aún</p>
          <p className="text-sm">Sube contenido privado para este perfil</p>
        </div>
      )}
    </div>
  );
};
