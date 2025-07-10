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
  likesCount: number; // Conteo total de likes
  isLikedByCurrentUser: boolean; // Si el usuario actual le dio like
  likedByUsers: User[]; // Lista de usuarios que dieron like
  isAvailable?: boolean;
  createdAt: Date;
  createdByUser?: User; // Usuario que creó el perfil
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

export interface Comment {
  id: string;
  profileId: string;
  userId: string;
  parentCommentId?: string;
  content: string;
  isDeleted: boolean;
  isHidden: boolean;
  isEdited: boolean;
  hiddenReason?: string;
  hiddenBy?: string;
  hiddenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  likesCount: number;
  dislikesCount: number;
  repliesCount: number;
  userLikeStatus?: 'like' | 'dislike' | null; // Estado del like del usuario actual
  replies?: Comment[]; // Respuestas anidadas
}

export interface CreateCommentData {
  profileId: string;
  content: string;
  parentCommentId?: string;
}

export interface CommentModerationData {
  isHidden: boolean;
  hiddenReason?: string;
}

export interface CreateUserData {
  fullName: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
}

// Tipos para videos privados
export interface PrivateVideoProfile {
  id: string;
  name: string;
  description: string;
  bodySize: 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';
  mainProfileId?: string; // Relación con perfil del catálogo principal
  mainProfile?: {
    id: string;
    name: string;
    age: number;
    residence?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy?: User;
  videosCount: number;
  photosCount: number;
  totalDurationMinutes: number;
  hasAccess: boolean;
  canUpload: boolean;
}

export interface PrivateVideo {
  id: string;
  profileId: string;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  fileSizeMb?: number;
  videoOrder: number;
  createdAt: Date;
  uploadedBy?: User;
}

export interface PrivatePhoto {
  id: string;
  profileId: string;
  photoUrl: string;
  photoOrder: number;
  createdAt: Date;
  uploadedBy?: User;
}

export interface PrivateVideoAccess {
  id: string;
  userId: string;
  profileId: string;
  canView: boolean;
  canUpload: boolean;
  grantedBy?: User;
  grantedAt: Date;
  user: User;
}

export interface PrivateVideoComment {
  id: string;
  profileId: string;
  userId: string;
  parentCommentId?: string;
  content: string;
  isDeleted: boolean;
  isHidden: boolean;
  isEdited: boolean;
  hiddenReason?: string;
  hiddenBy?: string;
  hiddenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  likesCount: number;
  dislikesCount: number;
  repliesCount: number;
  userLikeStatus?: 'like' | 'dislike' | null;
  replies?: PrivateVideoComment[];
}

export interface CreatePrivateVideoProfileData {
  name: string;
  description: string;
  bodySize: 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';
  mainProfileId?: string;
}

export interface CreatePrivateVideoCommentData {
  profileId: string;
  content: string;
  parentCommentId?: string;
}

export interface CreatePrivateVideoData {
  profileId: string;
  title: string;
  videoFile: File;
  thumbnailFile?: File;
}

export interface CreatePrivatePhotoData {
  profileId: string;
  photoFile: File;
}