import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para la base de datos
export interface DatabaseProfile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  net_salary: string;
  father_job: string;
  mother_job: string;
  height: 'Pequeña' | 'Mediana' | 'Alta';
  body_size: 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';
  bust_size: 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';
  skin_color: 'Blanca' | 'India' | 'Morena';
  nationality: string;
  residence: string;
  living_with: 'Sola' | 'Con la familia' | 'Con una amiga';
  instagram: string;
  music_tags: string[];
  place_tags: string[];
  is_favorite: boolean;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseProfilePhoto {
  id: string;
  profile_id: string;
  photo_url: string;
  video_url?: string;
  media_type: 'photo' | 'video';
  photo_order: number;
  created_at: string;
}

export interface DatabaseUser {
  id: string;
  full_name: string;
  username: string;
  password_hash: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}