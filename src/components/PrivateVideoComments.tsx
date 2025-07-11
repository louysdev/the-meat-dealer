import React, { useState } from 'react';
import { MessageCircle, Send, ThumbsUp, ThumbsDown, Reply, Edit, Trash2, Flag, Eye, EyeOff } from 'lucide-react';
import { PrivateVideoComment, User } from '../types';
import { usePrivateVideoComments } from '../hooks/usePrivateVideoComments';
import { getTimeAgo } from '../utils/dateUtils';

interface PrivateVideoCommentsProps {
  profileId: string;
  currentUser: User | null;
}

interface CommentItemProps {
  comment: PrivateVideoComment;
  currentUser: User | null;
  onReply: (parentId: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  onToggleLike: (commentId: string, isLike: boolean) => void;
  onModerate: (commentId: string, isHidden: boolean, reason?: string) => void;
  isReply?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUser,
  onReply,
  onEdit,
  onDelete,
  onToggleLike,
  onModerate,
  isReply = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [moderationReason, setModerationReason] = useState('');

  const canEdit = currentUser?.id === comment.userId;
  const canDelete = currentUser?.id === comment.userId || currentUser?.role === 'admin';
  const canModerate = currentUser?.role === 'admin';

  const handleEdit = () => {
    if (editContent.trim() && editContent !== comment.content) {
      onEdit(comment.id, editContent.trim());
      setIsEditing(false);
    } else {
      setIsEditing(false);
      setEditContent(comment.content);
    }
  };

  const handleModerate = (isHidden: boolean) => {
    onModerate(comment.id, isHidden, moderationReason || undefined);
    setShowModerationModal(false);
    setModerationReason('');
  };

  if (comment.isHidden && currentUser?.role !== 'admin') {
    return null;
  }

  return (
    <div className={`${isReply ? 'ml-4 sm:ml-8 border-l-2 border-gray-700 pl-2 sm:pl-4' : ''} mb-4`}>
      <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700">
        {/* Header del comentario */}
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs sm:text-sm">
                {comment.user.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-white font-medium text-sm sm:text-base truncate">{comment.user.fullName}</span>
                <span className="text-gray-400 text-xs sm:text-sm truncate">@{comment.user.username}</span>
                {comment.user.role === 'admin' && (
                  <span className="bg-purple-600/20 text-purple-300 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs flex-shrink-0">
                    Admin
                  </span>
                )}
                {comment.isEdited && (
                  <span className="text-gray-500 text-xs flex-shrink-0">(editado)</span>
                )}
                {comment.isHidden && currentUser?.role === 'admin' && (
                  <span className="bg-red-600/20 text-red-300 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs flex items-center space-x-1 flex-shrink-0">
                    <EyeOff className="w-3 h-3" />
                    <span>Oculto</span>
                  </span>
                )}
              </div>
              <div className="text-gray-400 text-xs sm:text-sm">
                {getTimeAgo(comment.createdAt)}
              </div>
            </div>
          </div>

          {/* Acciones del comentario */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {canModerate && (
              <button
                onClick={() => setShowModerationModal(true)}
                className="p-1 text-yellow-400 hover:text-yellow-300 transition-colors text-xs sm:text-sm"
                title="Moderar comentario"
              >
                <Flag className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            )}
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-blue-400 hover:text-blue-300 transition-colors text-xs sm:text-sm"
                title="Editar comentario"
              >
                <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(comment.id)}
                className="p-1 text-red-400 hover:text-red-300 transition-colors text-xs sm:text-sm"
                title="Eliminar comentario"
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Contenido del comentario */}
        {isEditing ? (
          <div className="mb-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white resize-none focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
              rows={3}
              maxLength={1000}
            />
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 mt-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                className="px-3 py-1 text-gray-400 hover:text-white transition-colors text-sm order-2 sm:order-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleEdit}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-sm order-1 sm:order-2"
              >
                Guardar
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-3">
            <p className="text-gray-300 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{comment.content}</p>
          </div>
        )}

        {/* Acciones de interacción */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Likes y Dislikes */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => onToggleLike(comment.id, true)}
                className={`flex items-center space-x-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded transition-colors text-xs sm:text-sm ${
                  comment.userLikeStatus === 'like'
                    ? 'bg-green-600/20 text-green-300'
                    : 'text-gray-400 hover:text-green-300 hover:bg-green-600/10'
                }`}
              >
                <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-sm">{comment.likesCount}</span>
              </button>
              <button
                onClick={() => onToggleLike(comment.id, false)}
                className={`flex items-center space-x-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded transition-colors text-xs sm:text-sm ${
                  comment.userLikeStatus === 'dislike'
                    ? 'bg-red-600/20 text-red-300'
                    : 'text-gray-400 hover:text-red-300 hover:bg-red-600/10'
                }`}
              >
                <ThumbsDown className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-sm">{comment.dislikesCount}</span>
              </button>
            </div>

            {/* Responder */}
            {!isReply && currentUser && (
              <button
                onClick={() => onReply(comment.id)}
                className="flex items-center space-x-1 text-gray-400 hover:text-blue-300 transition-colors text-xs sm:text-sm"
              >
                <Reply className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-sm">Responder</span>
              </button>
            )}
          </div>

          {/* Contador de respuestas */}
          {comment.repliesCount > 0 && (
            <span className="text-gray-400 text-xs sm:text-sm">
              {comment.repliesCount} respuesta{comment.repliesCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Respuestas */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleLike={onToggleLike}
              onModerate={onModerate}
              isReply={true}
            />
          ))}
        </div>
      )}

      {/* Modal de moderación */}
      {showModerationModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Moderar Comentario</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Razón de moderación (opcional)
                </label>
                <textarea
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  placeholder="Especifica la razón para ocultar este comentario..."
                />
              </div>

              <div className="flex space-x-3">
                {comment.isHidden ? (
                  <button
                    onClick={() => handleModerate(false)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Mostrar</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleModerate(true)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <EyeOff className="w-4 h-4" />
                    <span>Ocultar</span>
                  </button>
                )}
                <button
                  onClick={() => setShowModerationModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const PrivateVideoComments: React.FC<PrivateVideoCommentsProps> = ({
  profileId,
  currentUser
}) => {
  const {
    comments,
    loading,
    error,
    submitComment,
    editComment,
    deleteComment,
    toggleLike,
    moderateComment,
    submitting
  } = usePrivateVideoComments(profileId, currentUser?.id);

  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUser || submitting) return;

    try {
      await submitComment(newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Error enviando comentario:', error);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !currentUser || !replyingTo || submitting) return;

    try {
      await submitComment(replyContent.trim(), replyingTo);
      setReplyContent('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error enviando respuesta:', error);
    }
  };

  const handleEdit = async (commentId: string, content: string) => {
    try {
      await editComment(commentId, content);
    } catch (error) {
      console.error('Error editando comentario:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
      try {
        await deleteComment(commentId);
      } catch (error) {
        console.error('Error eliminando comentario:', error);
      }
    }
  };

  const handleToggleLike = async (commentId: string, isLike: boolean) => {
    try {
      await toggleLike(commentId, isLike);
    } catch (error) {
      console.error('Error actualizando reacción:', error);
    }
  };

  const handleModerate = async (commentId: string, isHidden: boolean, reason?: string) => {
    try {
      await moderateComment(commentId, isHidden, reason);
    } catch (error) {
      console.error('Error moderando comentario:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center space-x-3 mb-6">
        <MessageCircle className="w-6 h-6 text-red-400" />
        <h3 className="text-xl font-bold text-white">
          Comentarios ({comments.length})
        </h3>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* Formulario para nuevo comentario */}
      {currentUser && (
        <div className="mb-6">
          <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escribe un comentario..."
              className="w-full bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none"
              rows={3}
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-gray-400 text-sm">
                {newComment.length}/1000 caracteres
              </span>
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Enviando...' : 'Comentar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de comentarios */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No hay comentarios aún</p>
            {currentUser && (
              <p className="text-gray-500 text-sm mt-2">¡Sé el primero en comentar!</p>
            )}
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              onReply={setReplyingTo}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleLike={handleToggleLike}
              onModerate={handleModerate}
            />
          ))
        )}
      </div>

      {/* Modal para responder */}
      {replyingTo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Responder Comentario</h3>
            
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Escribe tu respuesta..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={4}
              maxLength={1000}
            />

            <div className="flex justify-between items-center mt-3">
              <span className="text-gray-400 text-sm">
                {replyContent.length}/1000 caracteres
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent('');
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitReply}
                  disabled={!replyContent.trim() || submitting}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {submitting ? 'Enviando...' : 'Responder'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};