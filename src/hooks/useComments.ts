import { useState, useEffect, useCallback } from 'react';
import { Comment, CreateCommentData, CommentModerationData } from '../types';
import * as commentService from '../services/commentService';

interface UseCommentsResult {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  submitComment: (content: string, parentId?: string) => Promise<void>;
  editComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  toggleLike: (commentId: string, isLike: boolean) => Promise<void>;
  moderateComment: (commentId: string, isHidden: boolean, reason?: string) => Promise<void>;
  refreshComments: () => Promise<void>;
  submitting: boolean;
}

export const useComments = (
  profileId: string, 
  currentUserId?: string
): UseCommentsResult => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Cargar comentarios
  const loadComments = useCallback(async () => {
    if (!profileId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await commentService.getProfileComments(profileId, currentUserId);
      setComments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando comentarios');
    } finally {
      setLoading(false);
    }
  }, [profileId, currentUserId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const submitComment = async (content: string, parentId?: string) => {
    if (!currentUserId || submitting) return;

    try {
      setSubmitting(true);
      setError(null);

      const commentData: CreateCommentData = {
        profileId,
        content: content.trim(),
        parentCommentId: parentId
      };

      await commentService.createComment(commentData, currentUserId);
      await loadComments(); // Recargar para mostrar el nuevo comentario con estadísticas actualizadas
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error enviando comentario');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const editComment = async (commentId: string, content: string) => {
    if (!currentUserId) return;

    try {
      setError(null);
      await commentService.updateComment(commentId, content, currentUserId);
      await loadComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error editando comentario');
      throw err;
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!currentUserId) return;

    try {
      setError(null);
      await commentService.deleteComment(commentId, currentUserId);
      await loadComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando comentario');
      throw err;
    }
  };

  const toggleLike = async (commentId: string, isLike: boolean) => {
    if (!currentUserId) return;

    try {
      setError(null);
      await commentService.toggleCommentLike(commentId, currentUserId, isLike);
      await loadComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualizando like');
      throw err;
    }
  };

  const moderateComment = async (commentId: string, isHidden: boolean, reason?: string) => {
    if (!currentUserId) return;

    try {
      setError(null);
      const moderationData: CommentModerationData = { isHidden, hiddenReason: reason };
      await commentService.moderateComment(commentId, moderationData, currentUserId);
      await loadComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error moderando comentario');
      throw err;
    }
  };

  return {
    comments,
    loading,
    error,
    submitComment,
    editComment,
    deleteComment,
    toggleLike,
    moderateComment,
    refreshComments: loadComments,
    submitting
  };
};