import { useState, useEffect } from 'react';
import { Comment, CreateCommentData, CommentModerationData } from '../types';
import * as commentService from '../services/commentService';

export const useComments = (profileId: string, currentUserId?: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar comentarios
  const loadComments = async () => {
    try {
      setError(null);
      if (comments.length === 0) {
        setLoading(true);
      }
      const data = await commentService.getProfileComments(profileId, currentUserId);
      setComments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando comentarios');
      console.error('Error cargando comentarios:', err);
    } finally {
      setLoading(false);
    }
  };

  // Crear comentario
  const createComment = async (commentData: CreateCommentData) => {
    try {
      setError(null);
      if (!currentUserId) {
        throw new Error('Usuario no autenticado');
      }

      const newComment = await commentService.createComment(commentData, currentUserId);
      
      if (commentData.parentCommentId) {
        // Es una respuesta, actualizar el comentario padre
        setComments(prev => prev.map(comment => {
          if (comment.id === commentData.parentCommentId) {
            return {
              ...comment,
              repliesCount: comment.repliesCount + 1,
              replies: [...(comment.replies || []), newComment]
            };
          }
          return comment;
        }));
      } else {
        // Es un comentario principal
        setComments(prev => [newComment, ...prev]);
      }

      return newComment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creando comentario');
      throw err;
    }
  };

  // Editar comentario
  const updateComment = async (commentId: string, content: string) => {
    try {
      setError(null);
      if (!currentUserId) {
        throw new Error('Usuario no autenticado');
      }

      const updatedComment = await commentService.updateComment(commentId, content, currentUserId);
      
      // Actualizar en el estado local
      const updateCommentInList = (commentsList: Comment[]): Comment[] => {
        return commentsList.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, ...updatedComment };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: updateCommentInList(comment.replies)
            };
          }
          return comment;
        });
      };

      setComments(prev => updateCommentInList(prev));
      return updatedComment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualizando comentario');
      throw err;
    }
  };

  // Eliminar comentario
  const deleteComment = async (commentId: string) => {
    try {
      setError(null);
      if (!currentUserId) {
        throw new Error('Usuario no autenticado');
      }

      await commentService.deleteComment(commentId, currentUserId);
      
      // Remover del estado local
      const removeCommentFromList = (commentsList: Comment[]): Comment[] => {
        return commentsList.filter(comment => {
          if (comment.id === commentId) {
            return false;
          }
          if (comment.replies) {
            comment.replies = removeCommentFromList(comment.replies);
          }
          return true;
        });
      };

      setComments(prev => removeCommentFromList(prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando comentario');
      throw err;
    }
  };

  // Toggle like/dislike
  const toggleCommentLike = async (commentId: string, isLike: boolean) => {
    try {
      setError(null);
      if (!currentUserId) {
        throw new Error('Usuario no autenticado');
      }

      const result = await commentService.toggleCommentLike(commentId, currentUserId, isLike);
      
      // Actualizar en el estado local
      const updateCommentLikes = (commentsList: Comment[]): Comment[] => {
        return commentsList.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              userLikeStatus: result.userLikeStatus,
              likesCount: result.likesCount,
              dislikesCount: result.dislikesCount
            };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: updateCommentLikes(comment.replies)
            };
          }
          return comment;
        });
      };

      setComments(prev => updateCommentLikes(prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualizando reacción');
      throw err;
    }
  };

  // Moderar comentario (solo administradores)
  const moderateComment = async (commentId: string, moderationData: CommentModerationData) => {
    try {
      setError(null);
      if (!currentUserId) {
        throw new Error('Usuario no autenticado');
      }

      await commentService.moderateComment(commentId, moderationData, currentUserId);
      
      // Recargar comentarios para reflejar cambios de moderación
      await loadComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error moderando comentario');
      throw err;
    }
  };

  useEffect(() => {
    if (profileId) {
      console.log('useComments: Cargando comentarios para perfil:', profileId);
      loadComments();
    }
  }, [profileId, currentUserId]);

  return {
    comments,
    loading,
    error,
    createComment,
    updateComment,
    deleteComment,
    toggleCommentLike,
    moderateComment,
    refreshComments: loadComments
  };
};