import React, { useState, useEffect } from 'react';
import { MessageCircle, Eye, EyeOff, Flag, User, Calendar, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Comment, User as UserType } from '../types';
import { getCommentsForModeration, moderateComment } from '../services/commentService';
import { getTimeAgo } from '../utils/dateUtils';

interface CommentModerationProps {
  currentUser: UserType;
}

export const CommentModeration: React.FC<CommentModerationProps> = ({ currentUser }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [moderationReason, setModerationReason] = useState('');

  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCommentsForModeration();
      setComments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando comentarios');
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (commentId: string, isHidden: boolean, reason?: string) => {
    try {
      await moderateComment(commentId, { isHidden, hiddenReason: reason }, currentUser.id);
      await loadComments(); // Recargar comentarios
      setSelectedComment(null);
      setModerationReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error moderando comentario');
    }
  };

  const filteredComments = comments.filter(comment => {
    switch (filter) {
      case 'visible':
        return !comment.isHidden;
      case 'hidden':
        return comment.isHidden;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Flag className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-white">Moderación de Comentarios</h2>
          </div>
          
          {/* Filtros */}
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Todos ({comments.length})
            </button>
            <button
              onClick={() => setFilter('visible')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'visible'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Visibles ({comments.filter(c => !c.isHidden).length})
            </button>
            <button
              onClick={() => setFilter('hidden')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'hidden'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Ocultos ({comments.filter(c => c.isHidden).length})
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Lista de comentarios */}
        <div className="space-y-4">
          {filteredComments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No hay comentarios para mostrar</p>
            </div>
          ) : (
            filteredComments.map((comment) => (
              <div
                key={comment.id}
                className={`bg-gray-800/50 rounded-lg p-6 border transition-all ${
                  comment.isHidden
                    ? 'border-yellow-700 bg-yellow-900/10'
                    : 'border-gray-700'
                }`}
              >
                {/* Header del comentario */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
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
                        {comment.isHidden && (
                          <span className="bg-yellow-600/20 text-yellow-300 px-2 py-1 rounded text-xs">
                            Oculto
                          </span>
                        )}
                      </div>
                      <div className="text-gray-400 text-sm flex items-center space-x-2">
                        <Calendar className="w-3 h-3" />
                        <span>{getTimeAgo(comment.createdAt)}</span>
                        {comment.isEdited && <span>(editado)</span>}
                      </div>
                    </div>
                  </div>

                  {/* Acciones de moderación */}
                  <div className="flex space-x-2">
                    {comment.isHidden ? (
                      <button
                        onClick={() => handleModerate(comment.id, false)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg transition-colors flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Mostrar</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedComment(comment)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-lg transition-colors flex items-center space-x-1"
                      >
                        <EyeOff className="w-4 h-4" />
                        <span>Ocultar</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Contenido del comentario */}
                <div className="mb-4">
                  <p className="text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                </div>

                {/* Información del perfil */}
                {(comment as any).profile && (
                  <div className="mb-4 p-3 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <User className="w-4 h-4" />
                      <span>
                        Comentario en el perfil de {(comment as any).profile.first_name} {(comment as any).profile.last_name}
                      </span>
                    </div>
                  </div>
                )}

                {/* Estadísticas */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1 text-green-400">
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-sm">{comment.likesCount}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-red-400">
                      <ThumbsDown className="w-4 h-4" />
                      <span className="text-sm">{comment.dislikesCount}</span>
                    </div>
                    {comment.repliesCount > 0 && (
                      <div className="flex items-center space-x-1 text-blue-400">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">{comment.repliesCount} respuestas</span>
                      </div>
                    )}
                  </div>

                  {/* Información de moderación */}
                  {comment.isHidden && comment.hiddenReason && (
                    <div className="text-yellow-300 text-sm">
                      Razón: {comment.hiddenReason}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal para ocultar comentario */}
      {selectedComment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Ocultar Comentario</h3>
            
            <div className="mb-4 p-3 bg-gray-800 rounded-lg">
              <p className="text-gray-300 text-sm">{selectedComment.content}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Razón para ocultar (opcional)
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
                <button
                  onClick={() => handleModerate(selectedComment.id, true, moderationReason)}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Ocultar Comentario
                </button>
                <button
                  onClick={() => {
                    setSelectedComment(null);
                    setModerationReason('');
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
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