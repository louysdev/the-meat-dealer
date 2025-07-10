import { supabase } from '../lib/supabase';
import { base64ToFile } from '../utils/imageUtils';
import { 
  PrivateVideoProfile, 
  PrivateVideo, 
  PrivatePhoto, 
  PrivateVideoAccess, 
  PrivateVideoComment,
  CreatePrivateVideoProfileData,
  CreatePrivateVideoCommentData,
  CreatePrivateVideoData,
  CreatePrivatePhotoData,
  User
} from '../types';

// Helper para convertir usuario de la base de datos
const convertDatabaseUser = (dbUser: any): User => ({
  id: dbUser.id,
  fullName: dbUser.full_name,
  username: dbUser.username,
  role: dbUser.role,
  isActive: dbUser.is_active,
  canAccessPrivateVideos: dbUser.can_access_private_videos || dbUser.role === 'admin',
  createdAt: new Date(dbUser.created_at),
  updatedAt: new Date(dbUser.updated_at),
  createdBy: dbUser.created_by
});

// Convertir perfil de video privado de la base de datos
const convertDatabasePrivateVideoProfile = (
  dbProfile: any,
  stats: { videos_count: number; photos_count: number },
  hasAccess: boolean = false,
  canUpload: boolean = false
): PrivateVideoProfile => ({
  id: dbProfile.id,
  name: dbProfile.name,
  description: dbProfile.description,
  height: dbProfile.height,
  bodySize: dbProfile.body_size,
  bustSize: dbProfile.bust_size,
  mainProfileId: dbProfile.main_profile_id,
  mainProfile: dbProfile.main_profile ? {
    id: dbProfile.main_profile.id,
    name: `${dbProfile.main_profile.first_name} ${dbProfile.main_profile.last_name}`,
    age: dbProfile.main_profile.age,
    residence: dbProfile.main_profile.residence
  } : undefined,
  createdAt: new Date(dbProfile.created_at),
  updatedAt: new Date(dbProfile.updated_at),
  createdBy: dbProfile.created_by_user ? convertDatabaseUser(dbProfile.created_by_user) : undefined,
  videosCount: stats.videos_count,
  photosCount: stats.photos_count,
  hasAccess,
  canUpload
});

// Obtener perfiles de videos privados accesibles para el usuario
export const getPrivateVideoProfiles = async (currentUserId?: string): Promise<PrivateVideoProfile[]> => {
  try {
    console.log('Obteniendo perfiles de videos privados para usuario:', currentUserId);

    if (!currentUserId) {
      return [];
    }

    // Primero verificar si el usuario tiene acceso general a videos privados
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, can_access_private_videos')
      .eq('id', currentUserId)
      .single();

    if (userError) {
      throw new Error(`Error verificando permisos de usuario: ${userError.message}`);
    }

    const isAdmin = user?.role === 'admin';
    const canAccessPrivateVideos = isAdmin || user?.can_access_private_videos;

    console.log('Usuario:', {
      id: currentUserId,
      role: user?.role,
      can_access_private_videos: user?.can_access_private_videos,
      isAdmin,
      canAccessPrivateVideos
    });

    if (!canAccessPrivateVideos) {
      console.log('Usuario no tiene acceso a videos privados');
      return [];
    }

    // Obtener perfiles
    const { data: profiles, error: profilesError } = await supabase
      .from('private_video_profiles')
      .select(`
        *,
        main_profile:main_profile_id(
          id,
          first_name,
          last_name,
          age,
          residence
        ),
        created_by_user:created_by(
          id,
          full_name,
          username,
          role,
          is_active,
          can_access_private_videos,
          created_at,
          updated_at
        )
      `)
      .order('created_at', { ascending: false });

    if (profilesError) {
      throw new Error(`Error obteniendo perfiles privados: ${profilesError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      console.log('No se encontraron perfiles en la base de datos');
      return [];
    }

    console.log('Perfiles encontrados en BD:', profiles.length);

    // Para admins, mostrar todos los perfiles
    // Para usuarios regulares con acceso, mostrar solo sus propios perfiles o los que tienen acceso específico
    const filteredProfiles = isAdmin 
      ? profiles 
      : profiles.filter(profile => 
          profile.created_by === currentUserId || 
          // Aquí podrías agregar lógica adicional para perfiles con acceso específico
          true // Por ahora, mostrar todos los perfiles para usuarios con acceso general
        );

    console.log('Perfiles después del filtro:', filteredProfiles.length);

    // Obtener estadísticas para cada perfil
    const profilesWithStats = await Promise.all(
      filteredProfiles.map(async (profile) => {
        // Obtener estadísticas
        const { data: stats } = await supabase
          .rpc('get_private_video_stats', { profile_uuid: profile.id });

        const profileStats = stats?.[0] || { videos_count: 0, photos_count: 0 };

        return convertDatabasePrivateVideoProfile(
          profile,
          profileStats,
          true, // hasAccess = true porque ya verificamos el acceso general
          isAdmin || profile.created_by === currentUserId // canUpload = admin o creador del perfil
        );
      })
    );

    return profilesWithStats;
  } catch (error) {
    console.error('Error en getPrivateVideoProfiles:', error);
    throw error;
  }
};

// Crear nuevo perfil de video privado (solo admins)
export const createPrivateVideoProfile = async (
  profileData: CreatePrivateVideoProfileData,
  createdBy: string
): Promise<PrivateVideoProfile> => {
  try {
    const { data: profile, error } = await supabase
      .from('private_video_profiles')
      .insert([{
        name: profileData.name,
        description: profileData.description,
        height: profileData.height,
        body_size: profileData.bodySize,
        bust_size: profileData.bustSize,
        main_profile_id: profileData.mainProfileId,
        created_by: createdBy
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creando perfil privado: ${error.message}`);
    }

    // Subir archivos de media si existen
    if (profileData.media && profileData.media.length > 0) {
      for (let i = 0; i < profileData.media.length; i++) {
        const mediaItem = profileData.media[i];
        
        // Convertir base64 a File
        const fileExt = mediaItem.type === 'photo' ? 'jpg' : 'mp4';
        const file = base64ToFile(mediaItem.url, `${mediaItem.type}-${i}.${fileExt}`);
        
        if (mediaItem.type === 'photo') {
          await uploadPrivatePhoto({
            profileId: profile.id,
            photoFile: file
          }, createdBy);
        } else if (mediaItem.type === 'video') {
          await uploadPrivateVideo({
            profileId: profile.id,
            title: `Video ${i + 1}`,
            videoFile: file
          }, createdBy);
        }
      }
    }

    // Obtener estadísticas actualizadas después de subir archivos
    const { data: stats, error: statsError } = await supabase
      .rpc('get_private_video_stats', { profile_uuid: profile.id });

    if (statsError) {
      console.error('Error obteniendo estadísticas:', statsError);
      // Usar estadísticas por defecto si hay error
      const defaultStats = { videos_count: 0, photos_count: 0 };
      return convertDatabasePrivateVideoProfile(profile, defaultStats, true, true);
    }

    return convertDatabasePrivateVideoProfile(profile, stats, true, true);
  } catch (error) {
    console.error('Error en createPrivateVideoProfile:', error);
    throw error;
  }
};

// Obtener videos y fotos de un perfil privado
export const getPrivateProfileMedia = async (
  profileId: string,
  currentUserId?: string
): Promise<{ videos: PrivateVideo[]; photos: PrivatePhoto[] }> => {
  try {
    console.log('getPrivateProfileMedia llamado para perfil:', profileId, 'usuario:', currentUserId);
    
    if (!currentUserId) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar si el usuario tiene acceso a videos privados
    const { data: user } = await supabase
      .from('users')
      .select('role, can_access_private_videos')
      .eq('id', currentUserId)
      .single();

    console.log('Usuario encontrado:', user);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const isAdmin = user.role === 'admin';
    const hasPrivateAccess = user.can_access_private_videos === true;

    console.log('isAdmin:', isAdmin, 'hasPrivateAccess:', hasPrivateAccess);

    // Verificar acceso: admin o usuario con permisos
    if (!isAdmin && !hasPrivateAccess) {
      throw new Error('No tienes acceso a contenido privado');
    }

    // Obtener videos
    const { data: videos, error: videosError } = await supabase
      .from('private_videos')
      .select(`
        *,
        uploaded_by_user:uploaded_by(
          id,
          full_name,
          username,
          role,
          is_active,
          created_at,
          updated_at
        )
      `)
      .eq('profile_id', profileId)
      .order('video_order');

    if (videosError) {
      throw new Error(`Error obteniendo videos: ${videosError.message}`);
    }

    // Obtener fotos
    const { data: photos, error: photosError } = await supabase
      .from('private_photos')
      .select(`
        *,
        uploaded_by_user:uploaded_by(
          id,
          full_name,
          username,
          role,
          is_active,
          created_at,
          updated_at
        )
      `)
      .eq('profile_id', profileId)
      .order('photo_order');

    if (photosError) {
      throw new Error(`Error obteniendo fotos: ${photosError.message}`);
    }

    const convertedVideos: PrivateVideo[] = await Promise.all((videos || []).map(async video => {
      // Generar URL firmada para el video (bucket privado)
      let signedVideoUrl = video.video_url;
      
      if (video.video_url && video.video_url.includes('/object/public/')) {
        // Extraer la ruta del archivo desde la URL pública
        const urlParts = video.video_url.split('/object/public/private-videos/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          
          const { data, error } = await supabase.storage
            .from('private-videos')
            .createSignedUrl(filePath, 3600); // URL válida por 1 hora
          
          if (!error && data) {
            signedVideoUrl = data.signedUrl;
          }
        }
      }

      // Generar URL firmada para el thumbnail si existe
      let signedThumbnailUrl = video.thumbnail_url;
      if (video.thumbnail_url && video.thumbnail_url.includes('/object/public/')) {
        const urlParts = video.thumbnail_url.split('/object/public/private-videos/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          
          const { data, error } = await supabase.storage
            .from('private-videos')
            .createSignedUrl(filePath, 3600);
          
          if (!error && data) {
            signedThumbnailUrl = data.signedUrl;
          }
        }
      }

      return {
        id: video.id,
        profileId: video.profile_id,
        title: video.title,
        videoUrl: signedVideoUrl,
        thumbnailUrl: signedThumbnailUrl,
        durationSeconds: video.duration_seconds,
        fileSizeMb: video.file_size_mb,
        videoOrder: video.video_order,
        createdAt: new Date(video.created_at),
        uploadedBy: video.uploaded_by_user ? convertDatabaseUser(video.uploaded_by_user) : undefined
      };
    }));

    const convertedPhotos: PrivatePhoto[] = await Promise.all((photos || []).map(async photo => {
      // Generar URL firmada para la foto (bucket privado)
      let signedPhotoUrl = photo.photo_url;
      
      if (photo.photo_url && photo.photo_url.includes('/object/public/')) {
        // Extraer la ruta del archivo desde la URL pública
        const urlParts = photo.photo_url.split('/object/public/private-photos/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          
          const { data, error } = await supabase.storage
            .from('private-photos')
            .createSignedUrl(filePath, 3600); // URL válida por 1 hora
          
          if (!error && data) {
            signedPhotoUrl = data.signedUrl;
          }
        }
      }

      return {
        id: photo.id,
        profileId: photo.profile_id,
        photoUrl: signedPhotoUrl,
        photoOrder: photo.photo_order,
        createdAt: new Date(photo.created_at),
        uploadedBy: photo.uploaded_by_user ? convertDatabaseUser(photo.uploaded_by_user) : undefined
      };
    }));

    return { videos: convertedVideos, photos: convertedPhotos };
  } catch (error) {
    console.error('Error en getPrivateProfileMedia:', error);
    throw error;
  }
};

// Gestionar accesos de usuarios (solo admins)
export const getPrivateVideoAccesses = async (profileId: string): Promise<PrivateVideoAccess[]> => {
  try {
    const { data: accesses, error } = await supabase
      .from('private_video_access')
      .select(`
        *,
        user:user_id(
          id,
          full_name,
          username,
          role,
          is_active,
          created_at,
          updated_at
        ),
        granted_by_user:granted_by(
          id,
          full_name,
          username,
          role,
          is_active,
          created_at,
          updated_at
        )
      `)
      .eq('profile_id', profileId)
      .order('granted_at', { ascending: false });

    if (error) {
      throw new Error(`Error obteniendo accesos: ${error.message}`);
    }

    return (accesses || []).map(access => ({
      id: access.id,
      userId: access.user_id,
      profileId: access.profile_id,
      canView: access.can_view,
      canUpload: access.can_upload,
      grantedAt: new Date(access.granted_at),
      user: convertDatabaseUser(access.user),
      grantedBy: access.granted_by_user ? convertDatabaseUser(access.granted_by_user) : undefined
    }));
  } catch (error) {
    console.error('Error en getPrivateVideoAccesses:', error);
    throw error;
  }
};

// Otorgar o actualizar acceso (solo admins)
export const grantPrivateVideoAccess = async (
  userId: string,
  profileId: string,
  canView: boolean,
  canUpload: boolean,
  grantedBy: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('private_video_access')
      .upsert([{
        user_id: userId,
        profile_id: profileId,
        can_view: canView,
        can_upload: canUpload,
        granted_by: grantedBy,
        granted_at: new Date().toISOString()
      }], {
        onConflict: 'user_id,profile_id'
      });

    if (error) {
      throw new Error(`Error otorgando acceso: ${error.message}`);
    }
  } catch (error) {
    console.error('Error en grantPrivateVideoAccess:', error);
    throw error;
  }
};

// Revocar acceso (solo admins)
export const revokePrivateVideoAccess = async (userId: string, profileId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('private_video_access')
      .delete()
      .eq('user_id', userId)
      .eq('profile_id', profileId);

    if (error) {
      throw new Error(`Error revocando acceso: ${error.message}`);
    }
  } catch (error) {
    console.error('Error en revokePrivateVideoAccess:', error);
    throw error;
  }
};

// Obtener comentarios de un perfil de video privado
export const getPrivateVideoComments = async (
  profileId: string,
  currentUserId?: string
): Promise<PrivateVideoComment[]> => {
  try {
    if (!currentUserId) {
      return [];
    }

    // Verificar si el usuario tiene acceso a videos privados
    const { data: user } = await supabase
      .from('users')
      .select('role, can_access_private_videos')
      .eq('id', currentUserId)
      .single();

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const isAdmin = user.role === 'admin';
    const hasPrivateAccess = user.can_access_private_videos === true;

    // Verificar acceso: admin o usuario con permisos
    if (!isAdmin && !hasPrivateAccess) {
      throw new Error('No tienes acceso a contenido privado');
    }

    // Obtener comentarios principales
    const { data: comments, error } = await supabase
      .from('private_video_comments')
      .select(`
        *,
        user:user_id(
          id,
          full_name,
          username,
          role,
          is_active,
          created_at,
          updated_at
        )
      `)
      .eq('profile_id', profileId)
      .is('parent_comment_id', null)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Error obteniendo comentarios: ${error.message}`);
    }

    // Convertir y obtener estadísticas (implementación similar al sistema público)
    // Por simplicidad, retornamos la estructura básica
    return (comments || []).map(comment => ({
      id: comment.id,
      profileId: comment.profile_id,
      userId: comment.user_id,
      parentCommentId: comment.parent_comment_id,
      content: comment.content,
      isDeleted: comment.is_deleted,
      isHidden: comment.is_hidden,
      isEdited: comment.is_edited,
      hiddenReason: comment.hidden_reason,
      hiddenBy: comment.hidden_by,
      hiddenAt: comment.hidden_at ? new Date(comment.hidden_at) : undefined,
      createdAt: new Date(comment.created_at),
      updatedAt: new Date(comment.updated_at),
      user: convertDatabaseUser(comment.user),
      likesCount: 0, // TODO: Implementar conteo real
      dislikesCount: 0,
      repliesCount: 0,
      userLikeStatus: null
    }));
  } catch (error) {
    console.error('Error en getPrivateVideoComments:', error);
    throw error;
  }
};

// Crear comentario en video privado
export const createPrivateVideoComment = async (
  commentData: CreatePrivateVideoCommentData,
  userId: string
): Promise<PrivateVideoComment> => {
  try {
    // Verificar si el usuario tiene acceso a videos privados
    const { data: user } = await supabase
      .from('users')
      .select('role, can_access_private_videos')
      .eq('id', userId)
      .single();

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const isAdmin = user.role === 'admin';
    const hasPrivateAccess = user.can_access_private_videos === true;

    // Verificar acceso: admin o usuario con permisos
    if (!isAdmin && !hasPrivateAccess) {
      throw new Error('No tienes acceso a contenido privado');
    }

    const { data: comment, error } = await supabase
      .from('private_video_comments')
      .insert([{
        profile_id: commentData.profileId,
        user_id: userId,
        parent_comment_id: commentData.parentCommentId || null,
        content: commentData.content
      }])
      .select(`
        *,
        user:user_id(
          id,
          full_name,
          username,
          role,
          is_active,
          created_at,
          updated_at
        )
      `)
      .single();

    if (error) {
      throw new Error(`Error creando comentario: ${error.message}`);
    }

    return {
      id: comment.id,
      profileId: comment.profile_id,
      userId: comment.user_id,
      parentCommentId: comment.parent_comment_id,
      content: comment.content,
      isDeleted: comment.is_deleted,
      isHidden: comment.is_hidden,
      isEdited: comment.is_edited,
      hiddenReason: comment.hidden_reason,
      hiddenBy: comment.hidden_by,
      hiddenAt: comment.hidden_at ? new Date(comment.hidden_at) : undefined,
      createdAt: new Date(comment.created_at),
      updatedAt: new Date(comment.updated_at),
      user: convertDatabaseUser(comment.user),
      likesCount: 0,
      dislikesCount: 0,
      repliesCount: 0,
      userLikeStatus: null
    };
  } catch (error) {
    console.error('Error en createPrivateVideoComment:', error);
    throw error;
  }
};

// Subir video privado
export const uploadPrivateVideo = async (
  videoData: CreatePrivateVideoData,
  uploadedBy: string
): Promise<PrivateVideo> => {
  try {
    // Subir archivo de video
    const videoExt = videoData.videoFile.name.split('.').pop();
    const videoFileName = `${videoData.profileId}/${Date.now()}.${videoExt}`;
    
    const { error: videoError } = await supabase.storage
      .from('private-videos')
      .upload(videoFileName, videoData.videoFile);

    if (videoError) {
      throw new Error(`Error subiendo video: ${videoError.message}`);
    }

    const { data: { publicUrl: videoUrl } } = supabase.storage
      .from('private-videos')
      .getPublicUrl(videoFileName);

    // Subir thumbnail si existe
    let thumbnailUrl: string | undefined;
    if (videoData.thumbnailFile) {
      const thumbExt = videoData.thumbnailFile.name.split('.').pop();
      const thumbFileName = `${videoData.profileId}/thumb_${Date.now()}.${thumbExt}`;
      
      const { error: thumbError } = await supabase.storage
        .from('private-photos')
        .upload(thumbFileName, videoData.thumbnailFile);

      if (!thumbError) {
        const { data: { publicUrl } } = supabase.storage
          .from('private-photos')
          .getPublicUrl(thumbFileName);
        thumbnailUrl = publicUrl;
      }
    }

    // Obtener el siguiente orden
    const { data: lastVideo } = await supabase
      .from('private_videos')
      .select('video_order')
      .eq('profile_id', videoData.profileId)
      .order('video_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (lastVideo?.video_order || 0) + 1;

    // Crear registro en la base de datos
    const { data: video, error: dbError } = await supabase
      .from('private_videos')
      .insert([{
        profile_id: videoData.profileId,
        title: videoData.title,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        video_order: nextOrder,
        uploaded_by: uploadedBy
      }])
      .select()
      .single();

    if (dbError) {
      throw new Error(`Error guardando video: ${dbError.message}`);
    }

    return {
      id: video.id,
      profileId: video.profile_id,
      title: video.title,
      videoUrl: video.video_url,
      thumbnailUrl: video.thumbnail_url,
      durationSeconds: video.duration_seconds,
      fileSizeMb: video.file_size_mb,
      videoOrder: video.video_order,
      createdAt: new Date(video.created_at)
    };
  } catch (error) {
    console.error('Error en uploadPrivateVideo:', error);
    throw error;
  }
};

// Subir foto privada
export const uploadPrivatePhoto = async (
  photoData: CreatePrivatePhotoData,
  uploadedBy: string
): Promise<PrivatePhoto> => {
  try {
    // Subir archivo de foto
    const photoExt = photoData.photoFile.name.split('.').pop();
    const photoFileName = `${photoData.profileId}/${Date.now()}.${photoExt}`;
    
    const { error: photoError } = await supabase.storage
      .from('private-photos')
      .upload(photoFileName, photoData.photoFile);

    if (photoError) {
      throw new Error(`Error subiendo foto: ${photoError.message}`);
    }

    const { data: { publicUrl: photoUrl } } = supabase.storage
      .from('private-photos')
      .getPublicUrl(photoFileName);

    // Obtener el siguiente orden
    const { data: lastPhoto } = await supabase
      .from('private_photos')
      .select('photo_order')
      .eq('profile_id', photoData.profileId)
      .order('photo_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (lastPhoto?.photo_order || 0) + 1;

    // Crear registro en la base de datos
    const { data: photo, error: dbError } = await supabase
      .from('private_photos')
      .insert([{
        profile_id: photoData.profileId,
        photo_url: photoUrl,
        photo_order: nextOrder,
        uploaded_by: uploadedBy
      }])
      .select()
      .single();

    if (dbError) {
      throw new Error(`Error guardando foto: ${dbError.message}`);
    }

    return {
      id: photo.id,
      profileId: photo.profile_id,
      photoUrl: photo.photo_url,
      photoOrder: photo.photo_order,
      createdAt: new Date(photo.created_at)
    };
  } catch (error) {
    console.error('Error en uploadPrivatePhoto:', error);
    throw error;
  }
};

// Obtener perfiles del catálogo principal para selección
export const getMainProfiles = async (): Promise<{ id: string; name: string; age: number; residence?: string }[]> => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, age, residence')
      .order('first_name');

    if (error) {
      throw new Error(`Error obteniendo perfiles principales: ${error.message}`);
    }

    return (profiles || []).map(profile => ({
      id: profile.id,
      name: `${profile.first_name} ${profile.last_name}`,
      age: profile.age,
      residence: profile.residence
    }));
  } catch (error) {
    console.error('Error en getMainProfiles:', error);
    throw error;
  }
};

// Actualizar perfil de video privado (solo admins o creadores)
export const updatePrivateVideoProfile = async (
  profileId: string,
  profileData: Partial<CreatePrivateVideoProfileData>,
  currentUserId: string
): Promise<PrivateVideoProfile> => {
  try {
    // Verificar permisos
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentUserId)
      .single();

    const { data: profile } = await supabase
      .from('private_video_profiles')
      .select('created_by')
      .eq('id', profileId)
      .single();

    const isAdmin = user?.role === 'admin';
    const isCreator = profile?.created_by === currentUserId;

    if (!isAdmin && !isCreator) {
      throw new Error('No tienes permisos para editar este perfil');
    }

    // Actualizar perfil
    const { data: updatedProfile, error } = await supabase
      .from('private_video_profiles')
      .update({
        name: profileData.name,
        description: profileData.description,
        height: profileData.height,
        body_size: profileData.bodySize,
        bust_size: profileData.bustSize,
        main_profile_id: profileData.mainProfileId,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId)
      .select(`
        *,
        main_profile:main_profile_id(
          id,
          first_name,
          last_name,
          age,
          residence
        ),
        created_by_user:created_by(
          id,
          full_name,
          username,
          role,
          is_active,
          created_at,
          updated_at
        )
      `)
      .single();

    if (error) {
      throw new Error(`Error actualizando perfil: ${error.message}`);
    }

    // Obtener estadísticas
    const { data: stats } = await supabase
      .rpc('get_private_video_stats', { profile_uuid: profileId });

    const profileStats = stats?.[0] || { videos_count: 0, photos_count: 0 };

    return convertDatabasePrivateVideoProfile(
      updatedProfile,
      profileStats,
      true,
      isAdmin || isCreator
    );
  } catch (error) {
    console.error('Error en updatePrivateVideoProfile:', error);
    throw error;
  }
};

// Eliminar perfil de video privado (solo admins o creadores)
export const deletePrivateVideoProfile = async (
  profileId: string,
  currentUserId: string
): Promise<void> => {
  try {
    // Verificar permisos
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentUserId)
      .single();

    const { data: profile } = await supabase
      .from('private_video_profiles')
      .select('created_by')
      .eq('id', profileId)
      .single();

    const isAdmin = user?.role === 'admin';
    const isCreator = profile?.created_by === currentUserId;

    if (!isAdmin && !isCreator) {
      throw new Error('No tienes permisos para eliminar este perfil');
    }

    // Obtener archivos para eliminar del storage
    const { data: videos } = await supabase
      .from('private_videos')
      .select('video_url, thumbnail_url')
      .eq('profile_id', profileId);

    const { data: photos } = await supabase
      .from('private_photos')
      .select('photo_url')
      .eq('profile_id', profileId);

    // Eliminar archivos del storage
    const filesToDelete: string[] = [];

    (videos || []).forEach(video => {
      if (video.video_url?.includes('/object/public/')) {
        const urlParts = video.video_url.split('/object/public/private-videos/');
        if (urlParts.length > 1) {
          filesToDelete.push(urlParts[1]);
        }
      }
      if (video.thumbnail_url?.includes('/object/public/')) {
        const urlParts = video.thumbnail_url.split('/object/public/private-videos/');
        if (urlParts.length > 1) {
          filesToDelete.push(urlParts[1]);
        }
      }
    });

    (photos || []).forEach(photo => {
      if (photo.photo_url?.includes('/object/public/')) {
        const urlParts = photo.photo_url.split('/object/public/private-photos/');
        if (urlParts.length > 1) {
          filesToDelete.push(urlParts[1]);
        }
      }
    });

    // Eliminar archivos de videos del storage
    if (filesToDelete.length > 0) {
      const videoFiles = filesToDelete.filter(file => !file.includes('.jpg') && !file.includes('.jpeg') && !file.includes('.png'));
      const photoFiles = filesToDelete.filter(file => file.includes('.jpg') || file.includes('.jpeg') || file.includes('.png'));

      if (videoFiles.length > 0) {
        await supabase.storage
          .from('private-videos')
          .remove(videoFiles);
      }

      if (photoFiles.length > 0) {
        await supabase.storage
          .from('private-photos')
          .remove(photoFiles);
      }
    }

    // Eliminar registros de la base de datos (las foreign keys se encargan del cascade)
    const { error } = await supabase
      .from('private_video_profiles')
      .delete()
      .eq('id', profileId);

    if (error) {
      throw new Error(`Error eliminando perfil: ${error.message}`);
    }
  } catch (error) {
    console.error('Error en deletePrivateVideoProfile:', error);
    throw error;
  }
};

// Eliminar foto privada
export const deletePrivatePhoto = async (photoId: string): Promise<void> => {
  try {
    // Obtener información de la foto antes de eliminarla
    const { data: photo, error: getError } = await supabase
      .from('private_photos')
      .select('photo_url')
      .eq('id', photoId)
      .single();

    if (getError) {
      throw new Error(`Error obteniendo foto: ${getError.message}`);
    }

    // Extraer el nombre del archivo de la URL
    const fileName = photo.photo_url.split('/').pop();
    if (fileName) {
      // Eliminar archivo del storage
      const { error: storageError } = await supabase.storage
        .from('private-photos')
        .remove([fileName]);

      if (storageError) {
        console.warn('Error eliminando archivo del storage:', storageError.message);
        // Continuar con la eliminación del registro aunque falle el storage
      }
    }

    // Eliminar registro de la base de datos
    const { error: dbError } = await supabase
      .from('private_photos')
      .delete()
      .eq('id', photoId);

    if (dbError) {
      throw new Error(`Error eliminando foto de la base de datos: ${dbError.message}`);
    }
  } catch (error) {
    console.error('Error en deletePrivatePhoto:', error);
    throw error;
  }
};

// Eliminar video privado
export const deletePrivateVideo = async (videoId: string): Promise<void> => {
  try {
    // Obtener información del video antes de eliminarlo
    const { data: video, error: getError } = await supabase
      .from('private_videos')
      .select('video_url, thumbnail_url')
      .eq('id', videoId)
      .single();

    if (getError) {
      throw new Error(`Error obteniendo video: ${getError.message}`);
    }

    // Extraer nombres de archivos de las URLs
    const videoFileName = video.video_url.split('/').pop();
    const thumbnailFileName = video.thumbnail_url?.split('/').pop();
    
    const filesToDelete = [];
    if (videoFileName) filesToDelete.push(videoFileName);
    if (thumbnailFileName) filesToDelete.push(thumbnailFileName);

    if (filesToDelete.length > 0) {
      // Eliminar archivos del storage
      const { error: storageError } = await supabase.storage
        .from('private-videos')
        .remove(filesToDelete);

      if (storageError) {
        console.warn('Error eliminando archivos del storage:', storageError.message);
        // Continuar con la eliminación del registro aunque falle el storage
      }
    }

    // Eliminar registro de la base de datos
    const { error: dbError } = await supabase
      .from('private_videos')
      .delete()
      .eq('id', videoId);

    if (dbError) {
      throw new Error(`Error eliminando video de la base de datos: ${dbError.message}`);
    }
  } catch (error) {
    console.error('Error en deletePrivateVideo:', error);
    throw error;
  }
};