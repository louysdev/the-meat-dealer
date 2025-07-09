import React, { useState } from 'react';
import { Heart, Save, X } from 'lucide-react';
import { Profile } from '../types';
import { MediaUpload } from './MediaUpload';
import { TagInput } from './TagInput';

interface MediaItem {
  url: string;
  type: 'photo' | 'video';
}

interface EditProfileFormProps {
  profile: Profile;
  onSubmit: (profile: Profile) => void;
  onCancel: () => void;
}

export const EditProfileForm: React.FC<EditProfileFormProps> = ({ profile, onSubmit, onCancel }) => {
  // Combinar fotos y videos en un solo array de media
  const initialMedia: MediaItem[] = [
    ...profile.photos.map(url => ({ url, type: 'photo' as const })),
    ...profile.videos.map(url => ({ url, type: 'video' as const }))
  ];

  const [formData, setFormData] = useState({
    media: initialMedia,
    firstName: profile.firstName,
    lastName: profile.lastName,
    age: profile.age.toString(),
    netSalary: profile.netSalary,
    fatherJob: profile.fatherJob,
    motherJob: profile.motherJob,
    height: profile.height,
    bodySize: profile.bodySize,
    bustSize: profile.bustSize,
    skinColor: profile.skinColor,
    nationality: profile.nationality,
    residence: profile.residence,
    livingWith: profile.livingWith,
    instagram: profile.instagram,
    musicTags: profile.musicTags,
    placeTags: profile.placeTags,
    isAvailable: profile.isAvailable !== undefined ? profile.isAvailable : true,
  });

  const [errors, setErrors] = useState<string[]>([]);

  const validateForm = () => {
    const newErrors: string[] = [];

    if (formData.media.length < 1) {
      newErrors.push('Se requiere mínimo 1 archivo (foto o video)');
    }

    if (!formData.firstName.trim()) {
      newErrors.push('El nombre es obligatorio');
    }

    if (!formData.lastName.trim()) {
      newErrors.push('El apellido es obligatorio');
    }

    if (!formData.age || parseInt(formData.age) < 18 || parseInt(formData.age) > 60) {
      newErrors.push('La edad debe estar entre 18 y 60 años');
    }

    if (formData.musicTags.length === 0 && formData.placeTags.length === 0) {
      newErrors.push('Se requiere agregar al menos un gusto personal (música o lugar favorito)');
    }
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Separar fotos y videos
    const photos = formData.media.filter(m => m.type === 'photo').map(m => m.url);
    const videos = formData.media.filter(m => m.type === 'video').map(m => m.url);

    const updatedProfile: Profile = {
      ...profile,
      ...formData,
      photos,
      videos,
      age: parseInt(formData.age),
      isAvailable: formData.isAvailable,
      // Mantener los datos de likes existentes
      likesCount: profile.likesCount,
      isLikedByCurrentUser: profile.isLikedByCurrentUser,
      likedByUsers: profile.likedByUsers
    };

    onSubmit(updatedProfile);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Heart className="w-6 h-6 text-red-400 fill-current animate-pulse" />
            <h2 className="text-2xl font-bold text-white">Editar Perfil</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            <h4 className="text-red-300 font-medium mb-2">Por favor corrige los siguientes errores:</h4>
            <ul className="text-red-200 text-sm space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Media Upload */}
          <MediaUpload
            media={formData.media}
            onMediaChange={(media) => setFormData({ ...formData, media })}
          />

          {/* Información básica */}
          <div className="bg-gray-800/50 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-red-300 border-b border-red-800 pb-2">
              Información Básica
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Apellido *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Edad *
                </label>
                <input
                  type="number"
                  min="18"
                  max="60"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Situación económica */}
          <div className="bg-gray-800/50 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-red-300 border-b border-red-800 pb-2">
              Situación Económica
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Salario Neto (RD$)
                </label>
                <input
                  type="text"
                  value={formData.netSalary}
                  onChange={(e) => setFormData({ ...formData, netSalary: e.target.value })}
                  placeholder="Ej: RD$ 50,000"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cargo del Padre
                </label>
                <input
                  type="text"
                  value={formData.fatherJob}
                  onChange={(e) => setFormData({ ...formData, fatherJob: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cargo de la Madre
                </label>
                <input
                  type="text"
                  value={formData.motherJob}
                  onChange={(e) => setFormData({ ...formData, motherJob: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {/* Características físicas */}
          <div className="bg-gray-800/50 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-red-300 border-b border-red-800 pb-2">
              Características Físicas
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Altura
                </label>
                <select
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value as any })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="Pequeña">Pequeña</option>
                  <option value="Mediana">Mediana</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tamaño del Cuerpo
                </label>
                <select
                  value={formData.bodySize}
                  onChange={(e) => setFormData({ ...formData, bodySize: e.target.value as any })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                  <option value="XXXL">XXXL</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tamaño del Busto
                </label>
                <select
                  value={formData.bustSize}
                  onChange={(e) => setFormData({ ...formData, bustSize: e.target.value as any })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                  <option value="XXXL">XXXL</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Color de Piel
                </label>
                <select
                  value={formData.skinColor}
                  onChange={(e) => setFormData({ ...formData, skinColor: e.target.value as any })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="Blanca">Blanca</option>
                  <option value="India">India</option>
                  <option value="Morena">Morena</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div className="bg-gray-800/50 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-red-300 border-b border-red-800 pb-2">
              Ubicación
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nacionalidad
                </label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Lugar de Residencia
                </label>
                <input
                  type="text"
                  value={formData.residence}
                  onChange={(e) => setFormData({ ...formData, residence: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Vive
                </label>
                <select
                  value={formData.livingWith}
                  onChange={(e) => setFormData({ ...formData, livingWith: e.target.value as any })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="Sola">Sola</option>
                  <option value="Con la familia">Con la familia</option>
                  <option value="Con una amiga">Con una amiga</option>
                </select>
              </div>
            </div>
          </div>

          {/* Redes sociales */}
          <div className="bg-gray-800/50 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-red-300 border-b border-red-800 pb-2">
              Redes Sociales
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Instagram
              </label>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="@username"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Gustos */}
          <div className="bg-gray-800/50 rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-semibold text-red-300 border-b border-red-800 pb-2">
              Gustos Personales *
            </h3>
            <p className="text-gray-400 text-sm">
              * Se requiere agregar al menos un gusto personal (música o lugar favorito)
            </p>
            <TagInput
              tags={formData.musicTags}
              onTagsChange={(musicTags) => setFormData({ ...formData, musicTags })}
              placeholder="Ej: Reggaeton, Pop, Rock..."
              label="Música Favorita"
            />
            <TagInput
              tags={formData.placeTags}
              onTagsChange={(placeTags) => setFormData({ ...formData, placeTags })}
              placeholder="Ej: Playa, Antros, Cafeterías..."
              label="Lugares Favoritos"
            />
          </div>

          {/* Estado de Disponibilidad */}
          <div className="bg-gray-800/50 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-red-300 border-b border-red-800 pb-2">
              Estado de Disponibilidad
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center justify-center space-x-3 cursor-pointer bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-green-500 transition-colors group">
                <input
                  type="radio"
                  name="availability"
                  checked={formData.isAvailable}
                  onChange={() => setFormData({ ...formData, isAvailable: true })}
                  className="w-5 h-5 text-green-600 bg-gray-800 border-gray-600 focus:ring-green-500"
                />
                <span className="text-white flex items-center space-x-2 font-medium">
                  <span className="text-2xl">😏</span>
                  <span>Disponible</span>
                </span>
              </label>
              <label className="flex items-center justify-center space-x-3 cursor-pointer bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-red-500 transition-colors group">
                <input
                  type="radio"
                  name="availability"
                  checked={!formData.isAvailable}
                  onChange={() => setFormData({ ...formData, isAvailable: false })}
                  className="w-5 h-5 text-red-600 bg-gray-800 border-gray-600 focus:ring-red-500"
                />
                <span className="text-white flex items-center space-x-2 font-medium">
                  <span className="text-2xl">😔</span>
                  <span>No disponible</span>
                </span>
              </label>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3"
            >
              <X className="w-5 h-5" />
              <span>Cancelar</span>
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Save className="w-5 h-5" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};