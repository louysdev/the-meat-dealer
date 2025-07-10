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
  User,
  MediaItem
} from '../types';

// Convertir perfil de video privado de la base de datos
const convertDatabasePrivateVideoProfile = (
  dbProfile: any,
  stats: { videos_count: number; photos_count: number; total_duration_minutes: number },
  hasAccess: boolean = false,
  canUpload: boolean = false
): PrivateVideoProfile => ({
  id: dbProfile.id,
  name: dbProfile.name,
  description: dbProfile.description,
  bodySize: dbProfile.body_size,
  mainProfileId: dbProfile.main_profile_id,
  mainProfile: dbProfile.main_profile ? {
    id: dbProfile.main_profile.id,
    name: `${dbProfile.main_profile.first_name} ${dbProfile.main_profile.last_name}`,
    age: dbProfile.main_profile.age,
    residence: dbProfile.main_profile.residence
  } : undefined,
  createdAt: new Date(dbProfile.created_at),
  updatedAt: new Date(dbProfile.updated_at),
  createdBy: dbProfile.created_by_user ? {
    id: dbProfile.created_by_user.id,
    fullName: dbProfile.created_by_user.full_name,
    username: dbProfile.created_by_user.username,
    role: dbProfile.created_by_user.role,
    isActive: dbProfile.created_by_user.is_active,
    createdAt: new Date(dbProfile.created_by_user.created_at),
    updatedAt: new Date(dbProfile.created_by_user.updated_at)
  } : undefined,
  videosCount: stats.videos_count,
  photosCount: stats.photos_count,
  totalDurationMinutes: stats.total_duration_minutes,
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

    // Obtener perfiles a los que el usuario tiene acceso
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
          created_at,
          updated_at
        )
      `)
      .order('created_at', { ascending: false });

    if (profilesError) {
      throw new Error(`Error obteniendo perfiles privados: ${profilesError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      return [];
    }

    // Obtener accesos del usuario
    const { data: accesses, error: accessError } = await supabase
      .from('private_video_access')
      .select('*')
      .eq('user_id', currentUserId);

    if (accessError) {
      console.error('Error obteniendo accesos:', accessError);
    }

    const accessMap = (accesses || []).reduce((acc, access) => {
      acc[access.profile_id] = {
        canView: access.can_view,
        canUpload: access.can_upload
      };
      return acc;
    }, {} as Record<string, { canView: boolean; canUpload: boolean }>);

    // Verificar si es admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentUserId)
      .single();

    const isAdmin = user?.role === 'admin';

    // Obtener estadísticas y filtrar por acceso
    const profilesWithStats = await Promise.all(
      profiles.map(async (profile) => {
        const access = accessMap[profile.id];
        const hasAccess = isAdmin || (access?.canView === true);
        
        if (!hasAccess) {
          return null; // No incluir perfiles sin acceso
        }

        // Obtener estadísticas
        const { data: stats } = await supabase
          .rpc('get_private_video_stats', { profile_uuid: profile.id });

        const profileStats = stats?.[0] || { videos_count: 0, photos_count: 0, total_duration_minutes: 0 };

        return convertDatabasePrivateVideoProfile(
          profile,
          profileStats,
          hasAccess,
          isAdmin || (access?.canUpload === true)
        );
      })
    );

    return profilesWithStats.filter(profile => profile !== null) as PrivateVideoProfile[];
  } catch (error) {
    console.error('Error en getPrivateVideoProfiles:', error);
    throw error;
  }
};

// Crear nuevo perfil de video privado (solo admins)
export const createPrivateVideoProfile = async (
  profileData: CreatePrivateVideoProfileData & { media: MediaItem[] },
  createdBy: string
): Promise<PrivateVideoProfile> => {
  try {
    const { data: profile, error } = await supabase
      .from('private_video_profiles')
      .insert([{
        name: profileData.name,
        description: profileData.description,
        body_size: profileData.bodySize,
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

    const stats = { videos_count: 0, photos_count: 0, total_duration_minutes: 0 };
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
    if (!currentUserId) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar acceso
    const hasAccess = await supabase.rpc('user_has_private_access', {
      user_uuid: currentUserId,
      profile_uuid: profileId
    });

    if (!hasAccess.data) {
      throw new Error('No tienes acceso a este contenido privado');
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

    const convertedVideos: PrivateVideo[] = (videos || []).map(video => ({
      id: video.id,
      profileId: video.profile_id,
      title: video.title,
      videoUrl: video.video_url,
      thumbnailUrl: video.thumbnail_url,
      durationSeconds: video.duration_seconds,
      fileSizeMb: video.file_size_mb,
      videoOrder: video.video_order,
      createdAt: new Date(video.created_at),
      uploadedBy: video.uploaded_by_user ? {
        id: video.uploaded_by_user.id,
        fullName: video.uploaded_by_user.full_name,
        username: video.uploaded_by_user.username,
        role: video.uploaded_by_user.role,
        isActive: video.uploaded_by_user.is_active,
        createdAt: new Date(video.uploaded_by_user.created_at),
        updatedAt: new Date(video.uploaded_by_user.updated_at)
      } : undefined
    }));

    const convertedPhotos: PrivatePhoto[] = (photos || []).map(photo => ({
      id: photo.id,
      profileId: photo.profile_id,
      photoUrl: photo.photo_url,
      photoOrder: photo.photo_order,
      createdAt: new Date(photo.created_at),
      uploadedBy: photo.uploaded_by_user ? {
        id: photo.uploaded_by_user.id,
        fullName: photo.uploaded_by_user.full_name,
        username: photo.uploaded_by_user.username,
        role: photo.uploaded_by_user.role,
        isActive: photo.uploaded_by_user.is_active,
        createdAt: new Date(photo.uploaded_by_user.created_at),
        updatedAt: new Date(photo.uploaded_by_user.updated_at)
      } : undefined
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
      user: {
        id: access.user.id,
        fullName: access.user.full_name,
        username: access.user.username,
        role: access.user.role,
        isActive: access.user.is_active,
        createdAt: new Date(access.user.created_at),
        updatedAt: new Date(access.user.updated_at)
      },
      grantedBy: access.granted_by_user ? {
        id: access.granted_by_user.id,
        fullName: access.granted_by_user.full_name,
        username: access.granted_by_user.username,
        role: access.granted_by_user.role,
        isActive: access.granted_by_user.is_active,
        createdAt: new Date(access.granted_by_user.created_at),
        updatedAt: new Date(access.granted_by_user.updated_at)
      } : undefined
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

    // Verificar acceso
    const hasAccess = await supabase.rpc('user_has_private_access', {
      user_uuid: currentUserId,
      profile_uuid: profileId
    });

    if (!hasAccess.data) {
      throw new Error('No tienes acceso a este contenido privado');
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
      user: {
        id: comment.user.id,
        fullName: comment.user.full_name,
        username: comment.user.username,
        role: comment.user.role,
        isActive: comment.user.is_active,
        createdAt: new Date(comment.user.created_at),
        updatedAt: new Date(comment.user.updated_at)
      },
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
    // Verificar acceso
    const hasAccess = await supabase.rpc('user_has_private_access', {
      user_uuid: userId,
      profile_uuid: commentData.profileId
    });

    if (!hasAccess.data) {
      throw new Error('No tienes acceso a este contenido privado');
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
      user: {
        id: comment.user.id,
        fullName: comment.user.full_name,
        username: comment.user.username,
        role: comment.user.role,
        isActive: comment.user.is_active,
        createdAt: new Date(comment.user.created_at),
        updatedAt: new Date(comment.user.updated_at)
      },
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
const uploadPrivateVideo = async (
  videoData: CreatePrivateVideoData,
  uploadedBy: string
): Promise<PrivateVideo> => {
  try {
    // Subir archivo de video
    const videoExt = videoData.videoFile.name.split('.').pop();
    const videoFileName = `${videoData.profileId}/${Date.now()}.${videoExt}`;
    
    const { data: videoUpload, error: videoError } = await supabase.storage
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
      
      const { data: thumbUpload, error: thumbError } = await supabase.storage
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
      .single();

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
const uploadPrivatePhoto = async (
  photoData: CreatePrivatePhotoData,
  uploadedBy: string
): Promise<PrivatePhoto> => {
  try {
    // Subir archivo de foto
    const photoExt = photoData.photoFile.name.split('.').pop();
    const photoFileName = `${photoData.profileId}/${Date.now()}.${photoExt}`;
    
    const { data: photoUpload, error: photoError } = await supabase.storage
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
      .single();

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