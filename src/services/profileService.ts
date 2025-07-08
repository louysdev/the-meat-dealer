import { supabase } from '../lib/supabase';
import { Profile, MediaItem } from '../types';
import { DatabaseProfile, DatabaseProfilePhoto } from '../lib/supabase';

// Convertir perfil de la base de datos al tipo de la aplicación
const convertDatabaseProfileToProfile = (
  dbProfile: DatabaseProfile,
  media: MediaItem[],
  createdByUser?: any
): Profile => {
  const photos = media.filter(m => m.type === 'photo').map(m => m.url);
  const videos = media.filter(m => m.type === 'video').map(m => m.url);

  return {
    id: dbProfile.id,
    firstName: dbProfile.first_name,
    lastName: dbProfile.last_name,
    age: dbProfile.age,
    netSalary: dbProfile.net_salary,
    fatherJob: dbProfile.father_job,
    motherJob: dbProfile.mother_job,
    height: dbProfile.height,
    bodySize: dbProfile.body_size,
    bustSize: dbProfile.bust_size,
    skinColor: dbProfile.skin_color,
    nationality: dbProfile.nationality,
    residence: dbProfile.residence,
    livingWith: dbProfile.living_with,
    instagram: dbProfile.instagram,
    musicTags: dbProfile.music_tags,
    placeTags: dbProfile.place_tags,
    isFavorite: dbProfile.is_favorite,
    isAvailable: dbProfile.is_available,
    photos,
    videos,
    createdAt: new Date(dbProfile.created_at),
    createdByUser: createdByUser ? {
      id: createdByUser.id,
      fullName: createdByUser.full_name,
      username: createdByUser.username,
      role: createdByUser.role,
      isActive: createdByUser.is_active,
      createdAt: new Date(createdByUser.created_at),
      updatedAt: new Date(createdByUser.updated_at)
    } : undefined
  };
};

// Convertir perfil de la aplicación al tipo de la base de datos
const convertProfileToDatabaseProfile = (profile: Omit<Profile, 'id' | 'createdAt' | 'photos' | 'videos'>) => ({
  first_name: profile.firstName,
  last_name: profile.lastName,
  age: profile.age,
  net_salary: profile.netSalary,
  father_job: profile.fatherJob,
  mother_job: profile.motherJob,
  height: profile.height,
  body_size: profile.bodySize,
  bust_size: profile.bustSize,
  skin_color: profile.skinColor,
  nationality: profile.nationality,
  residence: profile.residence,
  living_with: profile.livingWith,
  instagram: profile.instagram,
  music_tags: profile.musicTags,
  place_tags: profile.placeTags,
  is_favorite: profile.isFavorite || false,
  is_available: profile.isAvailable !== undefined ? profile.isAvailable : true,
});

// Subir archivo (imagen o video) a Supabase Storage
export const uploadFile = async (file: File, profileId: string, order: number, type: 'photo' | 'video'): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const bucket = type === 'photo' ? 'profile-photos' : 'profile-videos';
  const fileName = `${profileId}/${order}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    throw new Error(`Error subiendo ${type}: ${error.message}`);
  }

  // Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return publicUrl;
};

// Eliminar archivo de Supabase Storage
export const deleteFile = async (fileUrl: string, type: 'photo' | 'video'): Promise<void> => {
  // Extraer el path del archivo de la URL
  const urlParts = fileUrl.split('/');
  const fileName = urlParts.slice(-2).join('/'); // profileId/order.ext
  const bucket = type === 'photo' ? 'profile-photos' : 'profile-videos';

  const { error } = await supabase.storage
    .from(bucket)
    .remove([fileName]);

  if (error) {
    console.error(`Error eliminando ${type}:`, error);
  }
};

// Convertir archivo base64 a File
const base64ToFile = (base64: string, fileName: string): File => {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], fileName, { type: mime });
};

// Obtener todos los perfiles
export const getProfiles = async (): Promise<Profile[]> => {
  try {
    // Obtener perfiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        *,
        created_by_user:created_by_user(
          id,
          full_name,
          username,
          role,
          is_active,
          created_at,
          updated_at
        )
      `)
      .order('created_at', { ascending: false });

    if (profilesError) {
      throw new Error(`Error obteniendo perfiles: ${profilesError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      return [];
    }

    // Obtener media para todos los perfiles
    const { data: media, error: mediaError } = await supabase
      .from('profile_photos')
      .select('*')
      .order('photo_order');

    if (mediaError) {
      throw new Error(`Error obteniendo media: ${mediaError.message}`);
    }

    // Agrupar media por perfil
    const mediaByProfile = (media || []).reduce((acc, item) => {
      if (!acc[item.profile_id]) {
        acc[item.profile_id] = [];
      }
      
      const mediaItem: MediaItem = {
        url: item.media_type === 'video' ? (item.video_url || item.photo_url) : item.photo_url,
        type: item.media_type || 'photo'
      };
      
      acc[item.profile_id].push(mediaItem);
      return acc;
    }, {} as Record<string, MediaItem[]>);

    // Convertir y combinar datos
    return profiles.map(profile => 
      convertDatabaseProfileToProfile(
        profile as DatabaseProfile,
        mediaByProfile[profile.id] || [],
        profile.created_by_user
      )
    );
  } catch (error) {
    console.error('Error en getProfiles:', error);
    throw error;
  }
};

// Crear nuevo perfil
export const createProfile = async (
  profileData: Omit<Profile, 'id' | 'createdAt'>, 
  createdByUserId?: string
): Promise<Profile> => {
  try {
    // Crear perfil en la base de datos
    const profileToInsert = {
      ...convertProfileToDatabaseProfile(profileData),
      created_by_user: createdByUserId
    };

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([profileToInsert])
      .select()
      .single();

    if (profileError) {
      throw new Error(`Error creando perfil: ${profileError.message}`);
    }

    const profileId = profile.id;
    const mediaItems: MediaItem[] = [];

    // Combinar fotos y videos en un solo array
    const allMedia = [
      ...profileData.photos.map(url => ({ url, type: 'photo' as const })),
      ...profileData.videos.map(url => ({ url, type: 'video' as const }))
    ];

    // Subir archivos
    for (let i = 0; i < allMedia.length; i++) {
      const mediaItem = allMedia[i];
      
      // Convertir base64 a File
      const fileExt = mediaItem.type === 'photo' ? 'jpg' : 'mp4';
      const file = base64ToFile(mediaItem.url, `${mediaItem.type}-${i}.${fileExt}`);
      
      // Subir archivo
      const fileUrl = await uploadFile(file, profileId, i, mediaItem.type);
      mediaItems.push({
        url: fileUrl,
        type: mediaItem.type
      });

      // Guardar referencia en la base de datos
      const { error: mediaError } = await supabase
        .from('profile_photos')
        .insert([{
          profile_id: profileId,
          photo_url: mediaItem.type === 'photo' ? fileUrl : '',
          video_url: mediaItem.type === 'video' ? fileUrl : null,
          media_type: mediaItem.type,
          photo_order: i
        }]);

      if (mediaError) {
        console.error('Error guardando referencia de media:', mediaError);
      }
    }

    return convertDatabaseProfileToProfile(profile as DatabaseProfile, mediaItems);
  } catch (error) {
    console.error('Error en createProfile:', error);
    throw error;
  }
};

// Actualizar perfil
export const updateProfile = async (updatedProfile: Profile): Promise<Profile> => {
  try {
    // Actualizar datos del perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update(convertProfileToDatabaseProfile(updatedProfile))
      .eq('id', updatedProfile.id)
      .select()
      .single();

    if (profileError) {
      throw new Error(`Error actualizando perfil: ${profileError.message}`);
    }

    // Obtener media actual
    const { data: currentMedia } = await supabase
      .from('profile_photos')
      .select('*')
      .eq('profile_id', updatedProfile.id)
      .order('photo_order');

    const currentMediaUrls = (currentMedia || []).map(m => 
      m.media_type === 'video' ? (m.video_url || m.photo_url) : m.photo_url
    );
    const newMediaItems: MediaItem[] = [];

    // Combinar fotos y videos actualizados
    const allMedia = [
      ...updatedProfile.photos.map(url => ({ url, type: 'photo' as const })),
      ...updatedProfile.videos.map(url => ({ url, type: 'video' as const }))
    ];

    // Procesar media
    for (let i = 0; i < allMedia.length; i++) {
      const mediaItem = allMedia[i];
      
      if (mediaItem.url.startsWith('data:')) {
        // Es nuevo archivo en base64, subirlo
        const fileExt = mediaItem.type === 'photo' ? 'jpg' : 'mp4';
        const file = base64ToFile(mediaItem.url, `${mediaItem.type}-${i}.${fileExt}`);
        const fileUrl = await uploadFile(file, updatedProfile.id, i, mediaItem.type);
        newMediaItems.push({
          url: fileUrl,
          type: mediaItem.type
        });

        // Guardar referencia
        await supabase
          .from('profile_photos')
          .upsert([{
            profile_id: updatedProfile.id,
            photo_url: mediaItem.type === 'photo' ? fileUrl : '',
            video_url: mediaItem.type === 'video' ? fileUrl : null,
            media_type: mediaItem.type,
            photo_order: i
          }]);
      } else {
        // Es archivo existente, mantenerlo
        newMediaItems.push(mediaItem);
      }
    }

    // Eliminar archivos que ya no están en uso
    const mediaToDelete = currentMediaUrls.filter(url => 
      !newMediaItems.some(item => item.url === url)
    );
    
    for (const mediaUrl of mediaToDelete) {
      const mediaRecord = currentMedia?.find(m => 
        (m.media_type === 'video' ? (m.video_url || m.photo_url) : m.photo_url) === mediaUrl
      );
      
      if (mediaRecord) {
        await deleteFile(mediaUrl, mediaRecord.media_type || 'photo');
        await supabase
          .from('profile_photos')
          .delete()
          .eq('id', mediaRecord.id);
      }
    }

    return convertDatabaseProfileToProfile(profile as DatabaseProfile, newMediaItems);
  } catch (error) {
    console.error('Error en updateProfile:', error);
    throw error;
  }
};

// Eliminar perfil
export const deleteProfile = async (profileId: string): Promise<void> => {
  try {
    // Obtener media del perfil
    const { data: media } = await supabase
      .from('profile_photos')
      .select('*')
      .eq('profile_id', profileId);

    // Eliminar archivos del storage
    if (media) {
      for (const item of media) {
        const url = item.media_type === 'video' ? (item.video_url || item.photo_url) : item.photo_url;
        await deleteFile(url, item.media_type || 'photo');
      }
    }

    // Eliminar perfil (los archivos se eliminan automáticamente por CASCADE)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId);

    if (error) {
      throw new Error(`Error eliminando perfil: ${error.message}`);
    }
  } catch (error) {
    console.error('Error en deleteProfile:', error);
    throw error;
  }
};

// Alternar favorito
export const toggleFavorite = async (profileId: string, isFavorite: boolean): Promise<void> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ is_favorite: isFavorite })
      .eq('id', profileId);

    if (error) {
      throw new Error(`Error actualizando favorito: ${error.message}`);
    }
  } catch (error) {
    console.error('Error en toggleFavorite:', error);
    throw error;
  }
};