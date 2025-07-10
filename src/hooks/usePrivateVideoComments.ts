import { useState, useEffect, useCallback } from 'react';
import { PrivateVideoComment, CreatePrivateVideoCommentData } from '../types';
import {
  getPrivateVideoComments,
  createPrivateVideoComment,
  editPrivateVideoComment,
  deletePrivateVideoComment,
  togglePrivateVideoCommentLike,
  moderatePrivateVideoComment
} from '../services/privateVideoService';

interface UsePrivateVideoCommentsResult {
  comments: PrivateVideoComment[];
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

export const usePrivateVideoComments = (
  profileId: string,
  currentUserId?: string
): UsePrivateVideoCommentsResult => {
  const [comments, setComments] = useState<PrivateVideoComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    if (!profileId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getPrivateVideoComments(profileId, currentUserId);
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

      const commentData: CreatePrivateVideoCommentData = {
        profileId,
        content: content.trim(),
        parentCommentId: parentId
      };

      await createPrivateVideoComment(commentData, currentUserId);
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
      await editPrivateVideoComment(commentId, content, currentUserId);
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
      await deletePrivateVideoComment(commentId, currentUserId);
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
      await togglePrivateVideoCommentLike(commentId, isLike, currentUserId);
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
      await moderatePrivateVideoComment(commentId, isHidden, reason, currentUserId);
      await loadComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error moderando comentario');
      throw err;
    }
  };

  const refreshComments = async () => {
    await loadComments();
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
    refreshComments,
    submitting
  };
};
