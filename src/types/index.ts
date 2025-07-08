export interface Profile {
  id: string;
  // Información básica
  photos: string[];
  videos: string[]; // Nueva propiedad para videos
  firstName: string;
  lastName: string;
  age: number;
  
  // Situación económica
  netSalary: string;
  fatherJob: string;
  motherJob: string;
  
  // Características físicas
  height: 'Pequeña' | 'Mediana' | 'Alta';
  bodySize: 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';
  bustSize: 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';
  skinColor: 'Blanca' | 'India' | 'Morena';
  
  // Ubicación
  nationality: string;
  residence: string;
  livingWith: 'Sola' | 'Con la familia' | 'Con una amiga';
  
  // Redes sociales
  instagram: string;
  
  // Gustos
  musicTags: string[];
  placeTags: string[];
  
  // Metadata
  isFavorite?: boolean;
  isAvailable?: boolean;
  createdAt: Date;
}

export interface MediaItem {
  id: string;
  url: string;
  type: 'photo' | 'video';
  order: number;
}