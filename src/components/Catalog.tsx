import React, { useState } from "react";
import { Search, Filter, Heart, X, ChevronDown, Eraser } from "lucide-react";
import { Profile } from "../types";
import { ProfileCard } from "./ProfileCard";

interface CatalogProps {
  profiles: Profile[];
  onProfileClick: (profile: Profile) => void;
  onToggleLike: (id: string) => void;
}

export const Catalog: React.FC<CatalogProps> = ({
  profiles,
  onProfileClick,
  onToggleLike,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "age" | "recent" | "likes">(
    "recent"
  );
  const [filterHeight, setFilterHeight] = useState<string>("all");
  const [filterBodySize, setFilterBodySize] = useState<string>("all");
  const [showLikedOnly, setShowLikedOnly] = useState(false);
  const [filterAvailability, setFilterAvailability] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort profiles
  const filteredProfiles = profiles
    .filter((profile) => {
      const matchesSearch =
        profile.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.residence?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.musicTags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        profile.placeTags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesHeight =
        filterHeight === "all" || profile.height === filterHeight;
      const matchesBodySize =
        filterBodySize === "all" || profile.bodySize === filterBodySize;
      const matchesLiked = !showLikedOnly || profile.isLikedByCurrentUser;
      const matchesAvailability =
        filterAvailability === "all" ||
        (filterAvailability === "available" && profile.isAvailable !== false) ||
        (filterAvailability === "unavailable" && profile.isAvailable === false);

      return (
        matchesSearch &&
        matchesHeight &&
        matchesBodySize &&
        matchesLiked &&
        matchesAvailability
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.firstName.localeCompare(b.firstName);
        case "age":
          return a.age - b.age;
        case "likes":
          // Ordenar por número de likes (descendente)
          if (a.likesCount !== b.likesCount) {
            return b.likesCount - a.likesCount;
          }
          // Si tienen el mismo número de likes, ordenar por fecha
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "recent":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

  const likedCount = profiles.filter((p) => p.isLikedByCurrentUser).length;
  const totalLikes = profiles.reduce((sum, p) => sum + p.likesCount, 0);

  // Verificar si hay filtros activos
  const hasActiveFilters =
    filterHeight !== "all" ||
    filterBodySize !== "all" ||
    filterAvailability !== "all" ||
    sortBy !== "recent";

  const clearAllFilters = () => {
    setFilterHeight("all");
    setFilterBodySize("all");
    setFilterAvailability("all");
    setSortBy("recent");
    setShowLikedOnly(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Catálogo de Mujeres
        </h1>
        <p className="text-gray-400 text-lg">
          Encuentra tu mujer perfecta en nuestro exclusivo catálogo
        </p>
      </div>

      {/* Search Bar - Full Width */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, ciudad, gustos musicales, lugares favoritos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 text-lg"
          />
        </div>
      </div>

      {/* Filter Controls */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Filters Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                showFilters || hasActiveFilters
                  ? "bg-red-600 text-white shadow-lg"
                  : "bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-700/50"
              }`}
            >
              <Filter className="w-5 h-5" />
              <span>Filtros</span>
              {hasActiveFilters && (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Liked Only Toggle */}
            <button
              onClick={() => setShowLikedOnly(!showLikedOnly)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                showLikedOnly
                  ? "bg-red-600 text-white shadow-lg"
                  : "bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-700/50"
              }`}
            >
              <Heart
                className={`w-5 h-5 ${showLikedOnly ? "fill-current" : ""}`}
              />
              <span>Solo me gusta</span>
            </button>

            {/* Clear Filters */}
            {(hasActiveFilters || showLikedOnly) && (
              <button
                onClick={clearAllFilters}
                className="flex items-center space-x-2 px-4 py-3 rounded-xl text-gray-400 hover:text-white transition-colors"
              >
                <Eraser className="w-4 h-4" />
                <span>Limpiar</span>
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
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="recent">Más recientes</option>
                  <option value="name">Por nombre</option>
                  <option value="age">Por edad</option>
                  <option value="likes">Más populares</option>
                </select>
              </div>

              {/* Height Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Altura
                </label>
                <select
                  value={filterHeight}
                  onChange={(e) => setFilterHeight(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">Todas las alturas</option>
                  <option value="Pequeña">Pequeña</option>
                  <option value="Mediana">Mediana</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>

              {/* Body Size Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tamaño del Culo
                </label>
                <select
                  value={filterBodySize}
                  onChange={(e) => setFilterBodySize(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
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

              {/* Availability Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Disponibilidad
                </label>
                <select
                  value={filterAvailability}
                  onChange={(e) => setFilterAvailability(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">Todas las disponibilidades</option>
                  <option value="available">😏 Disponibles</option>
                  <option value="unavailable">😔 No disponibles</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty state */}
      {filteredProfiles.length === 0 && (
        <div className="text-center py-16">
          <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            No se encontraron perfiles
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || hasActiveFilters || showLikedOnly
              ? "Intenta ajustar tus filtros de búsqueda"
              : "Aún no hay perfiles en el catálogo"}
          </p>
          {(hasActiveFilters || showLikedOnly) && (
            <button
              onClick={clearAllFilters}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Results count - moved to bottom */}
      <div className="mb-6 text-center">
        <div className="text-gray-400 text-sm">
          Mostrando {filteredProfiles.length} de {profiles.length} perfiles •{" "}
          {totalLikes} me gusta totales
        </div>
      </div>

      {/* Profile Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 p-4">
        {filteredProfiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            onClick={() => onProfileClick(profile)}
            onToggleLike={onToggleLike}
          />
        ))}
      </div>
    </div>
  );
};
