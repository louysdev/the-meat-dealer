import React, { useState } from 'react';
import { MessageCircle, Send, ThumbsUp, ThumbsDown, Reply, Shield, Edit, Trash2, Flag, Eye, EyeOff } from 'lucide-react';
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
  const [showReplies, setShowReplies] = useState(false);

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
    <div className={`border border-gray-700 rounded-lg p-4 ${isReply ? 'bg-gray-800/20 ml-8' : 'bg-gray-800/30'}`}>
      {/* Header del comentario */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {comment.user.fullName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-white font-medium">{comment.user.fullName}</span>
              <span className="text-gray-400">@{comment.user.username}</span>
              {comment.user.role === 'admin' && (
                <span className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded text-xs">
                  Admin
                </span>
              )}
              {comment.isEdited && (
                <span className="text-gray-500 text-xs">(editado)</span>
              )}
              {comment.isHidden && currentUser?.role === 'admin' && (
                <span className="bg-red-600/20 text-red-300 px-2 py-1 rounded text-xs flex items-center space-x-1">
                  <EyeOff className="w-3 h-3" />
                  <span>Oculto</span>
                </span>
              )}
            </div>
            <div className="text-gray-400 text-sm">
              {getTimeAgo(comment.createdAt)}
            </div>
          </div>
        </div>

        {/* Acciones de administración */}
        {canModerate && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowModerationModal(true)}
              className="text-gray-400 hover:text-yellow-300 transition-colors"
              title="Moderar"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Contenido del comentario */}
      <div className="mb-3">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
              maxLength={1000}
            />
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">{editContent.length}/1000</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEdit}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors text-sm"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
              {comment.content}
            </p>
            {comment.isHidden && currentUser?.role === 'admin' && comment.hiddenReason && (
              <div className="mt-2 p-2 bg-red-600/10 border border-red-600/30 rounded text-red-300 text-sm">
                <strong>Motivo:</strong> {comment.hiddenReason}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Acciones del comentario */}
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

          {/* Otras acciones */}
          <div className="flex items-center space-x-2">
            {!isReply && currentUser && (
              <button
                onClick={() => onReply(comment.id)}
                className="flex items-center space-x-1 text-gray-400 hover:text-purple-300 transition-colors text-xs sm:text-sm"
              >
                <Reply className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-sm">Responder</span>
              </button>
            )}

            {canEdit && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center space-x-1 text-gray-400 hover:text-blue-300 transition-colors text-xs sm:text-sm"
              >
                <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-sm">Editar</span>
              </button>
            )}

            {canDelete && (
              <button
                onClick={() => onDelete(comment.id)}
                className="flex items-center space-x-1 text-gray-400 hover:text-red-300 transition-colors text-xs sm:text-sm"
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-sm">Eliminar</span>
              </button>
            )}
          </div>
        </div>

        {/* Contador de respuestas */}
        {comment.repliesCount > 0 && (
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="text-purple-400 hover:text-purple-300 text-xs sm:text-sm transition-colors"
          >
            {showReplies ? 'Ocultar' : 'Ver'} {comment.repliesCount} respuesta{comment.repliesCount !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Respuestas */}
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-3">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-white mb-4">Moderar Comentario</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Motivo de moderación (opcional)
                </label>
                <textarea
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  placeholder="Describe el motivo de la moderación..."
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowModerationModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded transition-colors"
                >
                  Cancelar
                </button>
                
                {comment.isHidden ? (
                  <button
                    onClick={() => handleModerate(false)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded transition-colors flex items-center justify-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Mostrar</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleModerate(true)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded transition-colors flex items-center justify-center space-x-2"
                  >
                    <EyeOff className="w-4 h-4" />
                    <span>Ocultar</span>
                  </button>
                )}
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
    refreshComments,
    submitting
  } = usePrivateVideoComments(profileId, currentUser?.id);

  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      await submitComment(newComment.trim());
      setNewComment('');
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !replyingTo) return;

    try {
      await submitComment(replyContent.trim(), replyingTo);
      setReplyingTo(null);
      setReplyContent('');
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
  };

  const handleEdit = async (commentId: string, content: string) => {
    try {
      await editComment(commentId, content);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleDelete = async (commentId: string) => {
    const confirmed = window.confirm('¿Estás seguro de que quieres eliminar este comentario?');
    if (!confirmed) return;

    try {
      await deleteComment(commentId);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleToggleLike = async (commentId: string, isLike: boolean) => {
    try {
      await toggleLike(commentId, isLike);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleModerate = async (commentId: string, isHidden: boolean, reason?: string) => {
    try {
      await moderateComment(commentId, isHidden, reason);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-400">{error}</p>
        <button
          onClick={refreshComments}
          className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <MessageCircle className="w-6 h-6 text-purple-400" />
        <h3 className="text-xl font-bold text-white">
          Comentarios Privados ({comments.length})
        </h3>
      </div>

      {/* Formulario para nuevo comentario */}
      {currentUser && (
        <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold">
                {currentUser.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario privado..."
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Enviando...' : 'Comentar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de respuesta */}
      {replyingTo && currentUser && (
        <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-600/30 ml-8">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">
                {currentUser.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="text-sm text-purple-300 mb-2">Respondiendo...</div>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Escribe tu respuesta..."
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
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
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmitReply}
                    disabled={!replyContent.trim() || submitting}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors flex items-center space-x-2 text-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'Enviando...' : 'Responder'}</span>
                  </button>
                </div>
              </div>
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
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleLike={handleToggleLike}
              onModerate={handleModerate}
            />
          ))
        )}
      </div>

      {!currentUser && (
        <div className="text-center py-6 bg-gray-800/30 rounded-lg border border-gray-700">
          <Shield className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400">Inicia sesión para comentar en este contenido privado</p>
        </div>
      )}
    </div>
  );
};