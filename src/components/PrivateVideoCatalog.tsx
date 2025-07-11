import React, { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Shield,
  Users,
  Video,
  ChevronDown,
  Eraser,
} from "lucide-react";
import { PrivateVideoProfile, User } from "../types";
import { PrivateVideoCard } from "./PrivateVideoCard";
import { canUserCreatePrivateProfiles } from "../utils/privateVideoPermissions";

interface PrivateVideoCatalogProps {
  profiles: PrivateVideoProfile[];
  onProfileClick: (profile: PrivateVideoProfile) => void;
  onCreateProfile: () => void;
  currentUser?: User;
}

export const PrivateVideoCatalog: React.FC<PrivateVideoCatalogProps> = ({
  profiles,
  onProfileClick,
  onCreateProfile,
  currentUser,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "recent" | "videos">("recent");
  const [filterBodySize, setFilterBodySize] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Filtrar y ordenar perfiles
  const filteredProfiles = profiles
    .filter((profile) => {
      const matchesSearch =
        profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBodySize =
        filterBodySize === "all" || profile.bodySize === filterBodySize;

      return matchesSearch && matchesBodySize;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "videos":
          return b.videosCount - a.videosCount;
        case "recent":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

  const totalVideos = profiles.reduce((sum, p) => sum + p.videosCount, 0);
  const totalPhotos = profiles.reduce((sum, p) => sum + p.photosCount, 0);

  // Verificar si hay filtros activos
  const hasActiveFilters = filterBodySize !== "all" || sortBy !== "recent";

  const clearAllFilters = () => {
    setFilterBodySize("all");
    setSortBy("recent");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Shield className="w-8 h-8 text-purple-400" />
          <h1 className="text-4xl font-bold text-white">
            Videos Privados Exclusivos
          </h1>
        </div>
        <p className="text-gray-400 text-lg">
          Contenido exclusivo con acceso restringido
        </p>

        {/* Estadísticas globales */}
        <div className="flex justify-center space-x-8 mt-6 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {profiles.length}
            </div>
            <div className="text-gray-400">Perfiles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {totalVideos}
            </div>
            <div className="text-gray-400">Videos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {totalPhotos}
            </div>
            <div className="text-gray-400">Fotos</div>
          </div>
        </div>
      </div>

      {/* Search Bar - Full Width */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-lg"
          />
        </div>
      </div>

      {/* Filter Controls */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Create Profile Button (usuarios con permisos) */}
            {currentUser && canUserCreatePrivateProfiles(currentUser) && (
              <button
                onClick={onCreateProfile}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}

            {/* Filters Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                showFilters || hasActiveFilters
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-700/50"
              }`}
            >
              <Filter className="w-5 h-5" />
              {hasActiveFilters && (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center space-x-2 px-4 py-3 rounded-xl text-gray-400 hover:text-white transition-colors bg-gray-400/20 hover:bg-gray-400/30"
              >
                <Eraser className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 mt-8 border border-gray-700/50 animate-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ordenar por
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="recent">Más recientes</option>
                  <option value="name">Por nombre</option>
                  <option value="videos">Más videos</option>
                </select>
              </div>

              {/* Body Size Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tamaño del Cuerpo
                </label>
                <select
                  value={filterBodySize}
                  onChange={(e) => setFilterBodySize(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Todos los tamaños</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                  <option value="XXXL">XXXL</option>
                </select>
              </div>

              {/* Access Info */}
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <Users className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-300">
                    Acceso autorizado por administradores
                  </div>
                </div>
              </div>

              {/* Results count - moved here */}
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 text-sm">
                    Mostrando {filteredProfiles.length} de {profiles.length}{" "}
                    perfiles
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty state */}
      {filteredProfiles.length === 0 && (
        <div className="text-center py-16">
          <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            No se encontraron perfiles
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterBodySize !== "all"
              ? "Intenta ajustar tus filtros de búsqueda"
              : "Aún no tienes acceso a ningún perfil de videos privados"}
          </p>
          {currentUser?.role !== "admin" && (
            <p className="text-gray-500 text-sm">
              Contacta a un administrador para obtener acceso
            </p>
          )}
        </div>
      )}

      {/* Results count - moved to bottom */}
      <div className="mb-6 text-center">
        <div className="text-gray-400 text-sm">
          Mostrando {filteredProfiles.length} de {profiles.length} perfiles
        </div>
      </div>

      {/* Profile Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 p-4">
        {filteredProfiles.map((profile) => (
          <PrivateVideoCard
            key={profile.id}
            profile={profile}
            onClick={() => onProfileClick(profile)}
          />
        ))}
      </div>
    </div>
  );
};
