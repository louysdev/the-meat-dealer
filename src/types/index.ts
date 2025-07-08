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
  isAvailable?: boolean;
  createdAt: Date;
  createdByUser?: User; // Usuario que creó el perfil
  likesCount?: number; // Conteo total de likes
  isLikedByCurrentUser?: boolean; // Si el usuario actual le dio like
}

export interface MediaItem {
  id: string;
  url: string;
  type: 'photo' | 'video';
  order: number;
}

export interface User {
  id: string;
  fullName: string;
  username: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // ID del admin que creó el usuario
}

export interface CreateUserData {
  fullName: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
}

export interface ProfileLike {
  id: string;
  profileId: string;
  userId: string;
  user?: User;
  createdAt: Date;
}