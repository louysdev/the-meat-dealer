import React, { useRef } from 'react';
import { Upload, X, Camera } from 'lucide-react';
import { resizeImage } from '../utils/imageUtils';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onImagesChange,
  maxImages = 5
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length + images.length > maxImages) {
      alert(`Solo puedes subir máximo ${maxImages} imágenes`);
      return;
    }

    const newImages: string[] = [];
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        try {
          const resizedImage = await resizeImage(file);
          newImages.push(resizedImage);
        } catch (error) {
          console.error('Error resizing image:', error);
        }
      }
    }
    
    onImagesChange([...images, ...newImages]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-300">
          Fotos (mínimo 1, máximo {maxImages})
        </label>
        <span className="text-xs text-gray-400">
          {images.length}/{maxImages}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative group aspect-[2/3] rounded-lg overflow-hidden">
            <img
              src={image}
              alt={`Foto ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {images.length < maxImages && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="aspect-[2/3] border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-red-500 hover:bg-red-500/5 transition-colors"
          >
            <Camera className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-400 text-center px-2">
              Agregar foto
            </span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {images.length < 1 && (
        <p className="text-sm text-red-400">
          * Se requiere mínimo 1 foto
        </p>
      )}
    </div>
  );
};