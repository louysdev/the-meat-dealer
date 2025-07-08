import React, { useState } from 'react';
import { Search, Filter, Heart, SortAsc, Star } from 'lucide-react';
import { Profile } from '../types';
import { ProfileCard } from './ProfileCard';

interface CatalogProps {
  profiles: Profile[];
  onProfileClick: (profile: Profile) => void;
  onToggleLike: (id: string) => void;
}

export const Catalog: React.FC<CatalogProps> = ({ 
  profiles, 
  onProfileClick, 
  onToggleLike
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'age' | 'recent' | 'favorites'>('recent');
  const [filterHeight, setFilterHeight] = useState<string>('all');
  const [filterBodySize, setFilterBodySize] = useState<string>('all');
  const [showLikedOnly, setShowLikedOnly] = useState(false);
  const [filterAvailability, setFilterAvailability] = useState<string>('all');

  // Filter and sort profiles
  const filteredProfiles = profiles
    .filter(profile => {
      const matchesSearch = 
        profile.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.residence?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.musicTags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        profile.placeTags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesHeight = filterHeight === 'all' || profile.height === filterHeight;
      const matchesBodySize = filterBodySize === 'all' || profile.bodySize === filterBodySize;
      const matchesLiked = !showLikedOnly || profile.isLikedByCurrentUser;
      const matchesAvailability = filterAvailability === 'all' || 
        (filterAvailability === 'available' && profile.isAvailable !== false) ||
        (filterAvailability === 'unavailable' && profile.isAvailable === false);

      return matchesSearch && matchesHeight && matchesBodySize && matchesLiked && matchesAvailability;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.firstName.localeCompare(b.firstName);
        case 'age':
          return a.age - b.age;
        case 'favorites':
          // Ordenar por likes (más likes primero)
          const aLikes = a.likesCount || 0;
          const bLikes = b.likesCount || 0;
          if (aLikes !== bLikes) return bLikes - aLikes;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const likedCount = profiles.filter(p => p.isLikedByCurrentUser).length;
  const totalLikes = profiles.reduce((sum, p) => sum + (p.likesCount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Catálogo de Perfiles
        </h1>
        <p className="text-gray-400">
          Descubre {profiles.length} perfiles únicos • {totalLikes} likes totales
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800/50 rounded-xl p-6 mb-8 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, ciudad, gustos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Sort */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="recent">Más recientes</option>
              <option value="name">Por nombre</option>
              <option value="age">Por edad</option>
              <option value="favorites">Más populares</option>
            </select>
          </div>

          {/* Height Filter */}
          <div>
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

          {/* Liked Toggle */}
          <div>
            <button
              onClick={() => setShowLikedOnly(!showLikedOnly)}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                showLikedOnly
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-red-600/20'
              }`}
            >
              <Heart className={`w-4 h-4 ${showLikedOnly ? 'fill-current' : ''}`} />
              <span>Mis likes</span>
            </button>
          </div>

          {/* Availability Filter */}
          <div>
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

        {/* Results count */}
        <div className="text-gray-400 text-sm">
          Mostrando {filteredProfiles.length} de {profiles.length} perfiles
          {showLikedOnly && ` (${likedCount} con like)`}
          {filterAvailability === 'available' && ` (disponibles)`}
          {filterAvailability === 'unavailable' && ` (no disponibles)`}
        </div>
      </div>

      {/* Empty state */}
      {filteredProfiles.length === 0 && (
        <div className="text-center py-16">
          <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            No se encontraron perfiles
          </h3>
          <p className="text-gray-500">
            {searchTerm || filterHeight !== 'all' || filterBodySize !== 'all' || showLikedOnly
              ? 'Intenta ajustar tus filtros de búsqueda'
              : 'Aún no hay perfiles en el catálogo'}
          </p>
        </div>
      )}

      {/* Profile Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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