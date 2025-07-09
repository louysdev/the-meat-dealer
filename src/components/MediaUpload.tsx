import React, { useRef } from 'react';
import { Upload, X, Camera, Video, Play } from 'lucide-react';
import { resizeImage } from '../utils/imageUtils';

interface MediaItem {
  url: string;
  type: 'photo' | 'video';
}

interface MediaUploadProps {
  media: MediaItem[];
  onMediaChange: (media: MediaItem[]) => void;
  maxItems?: number;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  media,
  onMediaChange,
  maxItems = 8
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length + media.length > maxItems) {
      alert(`Solo puedes subir máximo ${maxItems} archivos (fotos y videos)`);
      return;
    }

    const newMedia: MediaItem[] = [];
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        try {
          const resizedImage = await resizeImage(file);
          newMedia.push({
            url: resizedImage,
            type: 'photo'
          });
        } catch (error) {
          console.error('Error resizing image:', error);
        }
      } else if (file.type.startsWith('video/')) {
        // Para videos, convertimos a base64 directamente
        const reader = new FileReader();
        reader.onload = () => {
          newMedia.push({
            url: reader.result as string,
            type: 'video'
          });
          
          // Actualizar solo cuando se complete la lectura del último archivo
          if (newMedia.length === files.filter(f => f.type.startsWith('video/') || f.type.startsWith('image/')).length) {
            onMediaChange([...media, ...newMedia]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
    
    // Si no hay videos, actualizar inmediatamente
    if (!files.some(f => f.type.startsWith('video/'))) {
      onMediaChange([...media, ...newMedia]);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeMedia = (index: number) => {
    onMediaChange(media.filter((_, i) => i !== index));
  };

  const moveMedia = (fromIndex: number, toIndex: number) => {
    const newMedia = [...media];
    const [movedItem] = newMedia.splice(fromIndex, 1);
    newMedia.splice(toIndex, 0, movedItem);
    onMediaChange(newMedia);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-300">
          Fotos y Videos (mínimo 1, máximo {maxItems})
        </label>
        <span className="text-xs text-gray-400">
          {media.length}/{maxItems}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {media.map((item, index) => (
          <div key={index} className="relative group aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
            {item.type === 'photo' ? (
              <img
                src={item.url}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="relative w-full h-full">
                <video
                  src={item.url}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Play className="w-8 h-8 text-white" />
                </div>
                <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                  VIDEO
                </div>
              </div>
            )}
            
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex space-x-2">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => moveMedia(index, index - 1)}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 transition-colors"
                    title="Mover hacia atrás"
                  >
                    <Camera className="w-4 h-4 rotate-180" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(index)}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                {index < media.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveMedia(index, index + 1)}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 transition-colors"
                    title="Mover hacia adelante"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
              #{index + 1}
            </div>
          </div>
        ))}

        {media.length < maxItems && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="col-span-full border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-red-500 hover:bg-red-500/5 transition-colors py-8"
          >
            <div className="flex space-x-2 mb-2">
              <Camera className="w-6 h-6 text-gray-400" />
              <Video className="w-6 h-6 text-gray-400" />
            </div>
            <span className="text-sm text-gray-400 text-center px-4">
              Agregar foto o video
            </span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="text-sm text-gray-400 space-y-1">
        <p>• Formatos soportados: JPG, PNG, GIF para fotos | MP4, MOV, AVI para videos</p>
        <p>• Tamaño máximo recomendado: 10MB por archivo</p>
        <p>• Puedes reordenar arrastrando o usando los botones de flecha</p>
      </div>

      {media.length < 1 && (
        <p className="text-sm text-red-400">
          * Se requiere mínimo 1 archivo (foto o video)
        </p>
      )}
    </div>
  );
};