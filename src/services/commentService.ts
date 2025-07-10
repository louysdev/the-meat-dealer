import { supabase } from '../lib/supabase';
import { Comment, CreateCommentData, CommentModerationData } from '../types';

// Convertir comentario de la base de datos al tipo de la aplicación
const convertDatabaseCommentToComment = (
  dbComment: any,
  stats: { likes_count: number; dislikes_count: number; replies_count: number },
  userLikeStatus?: 'like' | 'dislike' | null
): Comment => ({
  id: dbComment.id,
  profileId: dbComment.profile_id,
  userId: dbComment.user_id,
  parentCommentId: dbComment.parent_comment_id,
  content: dbComment.content,
  isDeleted: dbComment.is_deleted,
  isHidden: dbComment.is_hidden,
  isEdited: dbComment.is_edited,
  hiddenReason: dbComment.hidden_reason,
  hiddenBy: dbComment.hidden_by,
  hiddenAt: dbComment.hidden_at ? new Date(dbComment.hidden_at) : undefined,
  createdAt: new Date(dbComment.created_at),
  updatedAt: new Date(dbComment.updated_at),
  user: {
    id: dbComment.user.id,
    fullName: dbComment.user.full_name,
    username: dbComment.user.username,
    role: dbComment.user.role,
    isActive: dbComment.user.is_active,
    createdAt: new Date(dbComment.user.created_at),
    updatedAt: new Date(dbComment.user.updated_at)
  },
  likesCount: stats.likes_count,
  dislikesCount: stats.dislikes_count,
  repliesCount: stats.replies_count,
  userLikeStatus
});

// Obtener comentarios de un perfil
export const getProfileComments = async (profileId: string, currentUserId?: string): Promise<Comment[]> => {
  try {
    console.log('Obteniendo comentarios para perfil:', profileId);

    // Obtener comentarios principales (sin parent_comment_id)
    const { data: comments, error: commentsError } = await supabase
      .from('profile_comments')
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
      .eq('is_hidden', false)
      .order('created_at', { ascending: true });

    if (commentsError) {
      throw new Error(`Error obteniendo comentarios: ${commentsError.message}`);
    }

    if (!comments || comments.length === 0) {
      return [];
    }

    // Obtener estadísticas y estado de likes para cada comentario
    const commentsWithStats = await Promise.all(
      comments.map(async (comment) => {
        // Obtener estadísticas
        const { data: stats } = await supabase
          .rpc('get_comment_stats', { comment_uuid: comment.id });

        const commentStats = stats?.[0] || { likes_count: 0, dislikes_count: 0, replies_count: 0 };

        // Obtener estado de like del usuario actual
        let userLikeStatus: 'like' | 'dislike' | null = null;
        if (currentUserId) {
          const { data: userLike } = await supabase
            .from('comment_likes')
            .select('is_like')
            .eq('comment_id', comment.id)
            .eq('user_id', currentUserId)
            .maybeSingle();

          if (userLike) {
            userLikeStatus = userLike.is_like ? 'like' : 'dislike';
          }
        }

        const convertedComment = convertDatabaseCommentToComment(comment, commentStats, userLikeStatus);

        // Obtener respuestas si las hay
        if (commentStats.replies_count > 0) {
          convertedComment.replies = await getCommentReplies(comment.id, currentUserId);
        }

        return convertedComment;
      })
    );

    return commentsWithStats;
  } catch (error) {
    console.error('Error en getProfileComments:', error);
    throw error;
  }
};

// Obtener respuestas de un comentario
export const getCommentReplies = async (commentId: string, currentUserId?: string): Promise<Comment[]> => {
  try {
    const { data: replies, error: repliesError } = await supabase
      .from('profile_comments')
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
      .eq('parent_comment_id', commentId)
      .eq('is_deleted', false)
      .eq('is_hidden', false)
      .order('created_at', { ascending: true });

    if (repliesError) {
      throw new Error(`Error obteniendo respuestas: ${repliesError.message}`);
    }

    if (!replies || replies.length === 0) {
      return [];
    }

    // Obtener estadísticas para cada respuesta
    const repliesWithStats = await Promise.all(
      replies.map(async (reply) => {
        const { data: stats } = await supabase
          .rpc('get_comment_stats', { comment_uuid: reply.id });

        const replyStats = stats?.[0] || { likes_count: 0, dislikes_count: 0, replies_count: 0 };

        let userLikeStatus: 'like' | 'dislike' | null = null;
        if (currentUserId) {
          const { data: userLike } = await supabase
            .from('comment_likes')
            .select('is_like')
            .eq('comment_id', reply.id)
            .eq('user_id', currentUserId)
            .maybeSingle();

          if (userLike) {
            userLikeStatus = userLike.is_like ? 'like' : 'dislike';
          }
        }

        return convertDatabaseCommentToComment(reply, replyStats, userLikeStatus);
      })
    );

    return repliesWithStats;
  } catch (error) {
    console.error('Error en getCommentReplies:', error);
    throw error;
  }
};

// Crear nuevo comentario
export const createComment = async (commentData: CreateCommentData, userId: string): Promise<Comment> => {
  try {
    console.log('Creando comentario:', commentData);

    const { data: comment, error: commentError } = await supabase
      .from('profile_comments')
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

    if (commentError) {
      throw new Error(`Error creando comentario: ${commentError.message}`);
    }

    // Obtener estadísticas iniciales
    const stats = { likes_count: 0, dislikes_count: 0, replies_count: 0 };

    return convertDatabaseCommentToComment(comment, stats);
  } catch (error) {
    console.error('Error en createComment:', error);
    throw error;
  }
};

// Editar comentario
export const updateComment = async (commentId: string, content: string, userId: string): Promise<Comment> => {
  try {
    const { data: comment, error: updateError } = await supabase
      .from('profile_comments')
      .update({
        content,
        is_edited: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .eq('user_id', userId) // Solo el autor puede editar
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

    if (updateError) {
      throw new Error(`Error actualizando comentario: ${updateError.message}`);
    }

    // Obtener estadísticas actualizadas
    const { data: stats } = await supabase
      .rpc('get_comment_stats', { comment_uuid: commentId });

    const commentStats = stats?.[0] || { likes_count: 0, dislikes_count: 0, replies_count: 0 };

    return convertDatabaseCommentToComment(comment, commentStats);
  } catch (error) {
    console.error('Error en updateComment:', error);
    throw error;
  }
};

// Eliminar comentario (soft delete)
export const deleteComment = async (commentId: string, userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('profile_comments')
      .update({
        is_deleted: true,
        content: '[Comentario eliminado]',
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .eq('user_id', userId); // Solo el autor puede eliminar

    if (error) {
      throw new Error(`Error eliminando comentario: ${error.message}`);
    }
  } catch (error) {
    console.error('Error en deleteComment:', error);
    throw error;
  }
};

// Toggle like/dislike en comentario
export const toggleCommentLike = async (
  commentId: string, 
  userId: string, 
  isLike: boolean
): Promise<{ userLikeStatus: 'like' | 'dislike' | null; likesCount: number; dislikesCount: number }> => {
  try {
    console.log('Toggle like en comentario:', commentId, 'Usuario:', userId, 'Es like:', isLike);

    // Verificar si ya existe un like/dislike del usuario
    const { data: existingLike, error: checkError } = await supabase
      .from('comment_likes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      throw new Error(`Error verificando like existente: ${checkError.message}`);
    }

    let userLikeStatus: 'like' | 'dislike' | null = null;

    if (existingLike) {
      if (existingLike.is_like === isLike) {
        // Si es el mismo tipo de reacción, eliminarla
        const { error: deleteError } = await supabase
          .from('comment_likes')
          .delete()
          .eq('id', existingLike.id);

        if (deleteError) {
          throw new Error(`Error eliminando reacción: ${deleteError.message}`);
        }
        userLikeStatus = null;
      } else {
        // Si es diferente tipo de reacción, actualizarla
        const { error: updateError } = await supabase
          .from('comment_likes')
          .update({ is_like: isLike })
          .eq('id', existingLike.id);

        if (updateError) {
          throw new Error(`Error actualizando reacción: ${updateError.message}`);
        }
        userLikeStatus = isLike ? 'like' : 'dislike';
      }
    } else {
      // No existe reacción, crear nueva
      const { error: insertError } = await supabase
        .from('comment_likes')
        .insert([{
          comment_id: commentId,
          user_id: userId,
          is_like: isLike
        }]);

      if (insertError) {
        throw new Error(`Error creando reacción: ${insertError.message}`);
      }
      userLikeStatus = isLike ? 'like' : 'dislike';
    }

    // Obtener conteos actualizados
    const { data: stats } = await supabase
      .rpc('get_comment_stats', { comment_uuid: commentId });

    const commentStats = stats?.[0] || { likes_count: 0, dislikes_count: 0, replies_count: 0 };

    return {
      userLikeStatus,
      likesCount: commentStats.likes_count,
      dislikesCount: commentStats.dislikes_count
    };
  } catch (error) {
    console.error('Error en toggleCommentLike:', error);
    throw error;
  }
};

// Moderar comentario (solo administradores)
export const moderateComment = async (
  commentId: string, 
  moderationData: CommentModerationData, 
  moderatorId: string
): Promise<void> => {
  try {
    const updateData: any = {
      is_hidden: moderationData.isHidden,
      updated_at: new Date().toISOString()
    };

    if (moderationData.isHidden) {
      updateData.hidden_reason = moderationData.hiddenReason;
      updateData.hidden_by = moderatorId;
      updateData.hidden_at = new Date().toISOString();
    } else {
      updateData.hidden_reason = null;
      updateData.hidden_by = null;
      updateData.hidden_at = null;
    }

    const { error } = await supabase
      .from('profile_comments')
      .update(updateData)
      .eq('id', commentId);

    if (error) {
      throw new Error(`Error moderando comentario: ${error.message}`);
    }
  } catch (error) {
    console.error('Error en moderateComment:', error);
    throw error;
  }
};

// Obtener comentarios para moderación (solo administradores)
export const getCommentsForModeration = async (): Promise<Comment[]> => {
  try {
    const { data: comments, error: commentsError } = await supabase
      .from('profile_comments')
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
        profile:profile_id(
          id,
          first_name,
          last_name
        )
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (commentsError) {
      throw new Error(`Error obteniendo comentarios para moderación: ${commentsError.message}`);
    }

    if (!comments || comments.length === 0) {
      return [];
    }

    // Obtener estadísticas para cada comentario
    const commentsWithStats = await Promise.all(
      comments.map(async (comment) => {
        const { data: stats } = await supabase
          .rpc('get_comment_stats', { comment_uuid: comment.id });

        const commentStats = stats?.[0] || { likes_count: 0, dislikes_count: 0, replies_count: 0 };

        return {
          ...convertDatabaseCommentToComment(comment, commentStats),
          profile: comment.profile
        };
      })
    );

    return commentsWithStats;
  } catch (error) {
    console.error('Error en getCommentsForModeration:', error);
    throw error;
  }
};

// Obtener conteo de comentarios de un perfil
export const getProfileCommentsCount = async (profileId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .rpc('get_profile_comments_count', { profile_uuid: profileId });

    if (error) {
      throw new Error(`Error obteniendo conteo de comentarios: ${error.message}`);
    }

    return data || 0;
  } catch (error) {
    console.error('Error en getProfileCommentsCount:', error);
    return 0;
  }
};