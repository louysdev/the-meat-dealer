import React, { useState } from "react";
import {
  CircleUser,
  DollarSign,
  Flag,
  Heart,
  Home,
  Instagram,
  Save,
  Smile,
  User,
  X,
} from "lucide-react";
import { Profile } from "../types";
import { MediaUpload } from "./MediaUpload";
import { TagInput } from "./TagInput";

interface MediaItem {
  url: string;
  type: "photo" | "video";
}

interface AddProfileFormProps {
  onSubmit: (profile: Omit<Profile, "id" | "createdAt">) => void;
  onCancel?: () => void;
  onViewChange?: (view: "catalog" | "add") => void;
}

export const AddProfileForm: React.FC<AddProfileFormProps> = ({
  onSubmit,
  onCancel,
  onViewChange,
}) => {
  const [formData, setFormData] = useState({
    media: [] as MediaItem[],
    firstName: "",
    lastName: "",
    age: "",
    netSalary: "",
    fatherJob: "",
    motherJob: "",
    height: "Mediana" as const,
    bodySize: "M" as const,
    bustSize: "M" as const,
    skinColor: "Blanca" as const,
    nationality: "",
    residence: "",
    livingWith: "Con la familia" as const,
    instagram: "",
    musicTags: [] as string[],
    placeTags: [] as string[],
    isAvailable: true,
  });

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (onViewChange) {
      onViewChange("catalog");
    }
  };

  const [errors, setErrors] = useState<string[]>([]);

  const validateForm = () => {
    const newErrors: string[] = [];

    if (formData.media.length < 1) {
      newErrors.push("Se requiere mínimo 1 archivo (foto o video)");
    }

    if (!formData.firstName.trim()) {
      newErrors.push("El nombre es obligatorio");
    }

    if (!formData.lastName.trim()) {
      newErrors.push("El apellido es obligatorio");
    }

    if (
      !formData.age ||
      parseInt(formData.age) < 18 ||
      parseInt(formData.age) > 60
    ) {
      newErrors.push("La edad debe estar entre 18 y 60 años");
    }

    if (formData.musicTags.length === 0 && formData.placeTags.length === 0) {
      newErrors.push(
        "Se requiere agregar al menos un gusto personal (música o lugar favorito)"
      );
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
    const photos = formData.media
      .filter((m) => m.type === "photo")
      .map((m) => m.url);
    const videos = formData.media
      .filter((m) => m.type === "video")
      .map((m) => m.url);

    onSubmit({
      ...formData,
      photos,
      videos,
      age: parseInt(formData.age),
      likesCount: 0,
      isLikedByCurrentUser: false,
      likedByUsers: [],
    });

    // Reset form
    setFormData({
      media: [],
      firstName: "",
      lastName: "",
      age: "",
      netSalary: "",
      fatherJob: "",
      motherJob: "",
      height: "Mediana",
      bodySize: "M",
      bustSize: "M",
      skinColor: "Blanca",
      nationality: "",
      residence: "",
      livingWith: "Con la familia",
      instagram: "",
      musicTags: [],
      placeTags: [],
      isAvailable: true,
    });
    setErrors([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Heart className="w-6 h-6 text-red-400 fill-current animate-pulse" />
            <h2 className="text-2xl font-bold text-white">
              Agregar Nuevo Perfil
            </h2>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            <h4 className="text-red-300 font-medium mb-2">
              Por favor corrige los siguientes errores:
            </h4>
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
            <div className="flex items-center space-x-3 mb-4 *:text-red-300 border-b border-red-800 pb-2">
              <CircleUser className="w-5 h-5 " />
              <h3 className="text-lg font-semibold">Información Básica</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Situación económica */}
          <div className="bg-gray-800/50 rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-4 *:text-red-300 border-b border-red-800 pb-2">
              <DollarSign className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Situación Económica</h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Salario Neto (RD$)
                </label>
                <input
                  type="text"
                  value={formData.netSalary}
                  onChange={(e) =>
                    setFormData({ ...formData, netSalary: e.target.value })
                  }
                  placeholder="RD$ 50,000"
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
                  onChange={(e) =>
                    setFormData({ ...formData, fatherJob: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, motherJob: e.target.value })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {/* Características físicas */}
          <div className="bg-gray-800/50 rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-4 *:text-red-300 border-b border-red-800 pb-2">
              <User className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Características Físicas</h3>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Altura
                </label>
                <select
                  value={formData.height}
                  onChange={(e) =>
                    setFormData({ ...formData, height: e.target.value as any })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="Pequeña">Pequeña</option>
                  <option value="Mediana">Mediana</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tamaño del Culo
                </label>
                <select
                  value={formData.bodySize}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bodySize: e.target.value as any,
                    })
                  }
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
                  Tamaño de Teta
                </label>
                <select
                  value={formData.bustSize}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bustSize: e.target.value as any,
                    })
                  }
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      skinColor: e.target.value as any,
                    })
                  }
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
            <div className="flex items-center space-x-3 mb-4 *:text-red-300 border-b border-red-800 pb-2">
              <Home className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Ubicación</h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nacionalidad
                </label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) =>
                    setFormData({ ...formData, nationality: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, residence: e.target.value })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Vive
                </label>
                <select
                  value={formData.livingWith}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      livingWith: e.target.value as any,
                    })
                  }
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
            <div className="flex items-center space-x-3 mb-4 *:text-red-300 border-b border-red-800 pb-2">
              <Instagram className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Redes Sociales</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Instagram
              </label>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) =>
                  setFormData({ ...formData, instagram: e.target.value })
                }
                placeholder="@username"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Gustos */}
          <div className="bg-gray-800/50 rounded-xl p-6 space-y-6">
            <div className="flex items-center space-x-3 mb-4 *:text-red-300 border-b border-red-800 pb-2">
              <Smile className="w-5 h-5" />
              <h3 className="text-lg font-semibold ">Gustos Personales</h3>
            </div>

            <p className="text-gray-400 text-sm">
              * Se requiere agregar al menos un gusto personal (música o lugar
              favorito)
            </p>
            <TagInput
              tags={formData.musicTags}
              onTagsChange={(musicTags) =>
                setFormData({ ...formData, musicTags })
              }
              placeholder="Ej: Reggaeton, Pop, Rock..."
              label="Música Favorita"
            />
            <TagInput
              tags={formData.placeTags}
              onTagsChange={(placeTags) =>
                setFormData({ ...formData, placeTags })
              }
              placeholder="Ej: Playa, Antros, Cafeterías..."
              label="Lugares Favoritos"
            />
          </div>

          {/* Estado de Disponibilidad */}
          <div className="bg-gray-800/50 rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-4 *:text-red-300 border-b border-red-800 pb-2">
              <Flag className="w-5 h-5" />
              <h3 className="text-lg font-semibold ">
                Estado de Disponibilidad
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isAvailable: true })}
                className={`flex items-center justify-center space-x-3 cursor-pointer bg-gray-800 border-2 rounded-lg p-4 transition-colors group text-white ${
                  formData.isAvailable
                    ? "border-green-500"
                    : "border-gray-700 hover:border-green-500"
                }`}
              >
                <span className="flex items-center space-x-2 font-medium">
                  <span className="text-2xl">😏</span>
                  <span>Disponible</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isAvailable: false })}
                className={`flex items-center justify-center space-x-3 cursor-pointer bg-gray-800 border-2 rounded-lg p-4 transition-colors group text-white ${
                  !formData.isAvailable
                    ? "border-red-500"
                    : "border-gray-700 hover:border-red-500"
                }`}
              >
                <span className="flex items-center space-x-2 font-medium">
                  <span className="text-2xl">😔</span>
                  <span>No disponible</span>
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Save className="w-5 h-5" />
            <span>Guardar Perfil</span>
          </button>
        </form>
      </div>
    </div>
  );
};
