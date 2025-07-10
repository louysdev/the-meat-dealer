import React, { useState, useEffect } from 'react';
import { MessageCircle, Eye, EyeOff, Flag, User, Calendar, ThumbsUp, ThumbsDown, ArrowLeft, Shield, Users } from 'lucide-react';
import { Comment, PrivateVideoComment, User as UserType } from '../types';
import { getCommentsForModeration, moderateComment } from '../services/commentService';
import { getPrivateVideoCommentsForModeration, moderatePrivateVideoComment } from '../services/privateVideoService';
import { getTimeAgo } from '../utils/dateUtils';

interface CommentModerationProps {
  currentUser: UserType;
  onBack?: () => void;
}

type ModerationComment = (Comment | PrivateVideoComment) & {
  type: 'public' | 'private';
  profileName?: string;
};

export const CommentModerationNew: React.FC<CommentModerationProps> = ({ currentUser, onBack }) => {
  const [comments, setComments] = useState<ModerationComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'public' | 'private'>('all');
  const [selectedComment, setSelectedComment] = useState<ModerationComment | null>(null);
  const [moderationReason, setModerationReason] = useState('');

  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar comentarios públicos y privados en paralelo
      const [publicComments, privateComments] = await Promise.all([
        getCommentsForModeration(),
        getPrivateVideoCommentsForModeration()
      ]);

      // Combinar y marcar el tipo
      const allComments: ModerationComment[] = [
        ...publicComments.map(comment => ({ ...comment, type: 'public' as const })),
        ...privateComments.map(comment => ({ ...comment, type: 'private' as const }))
      ];

      // Ordenar por fecha de creación (más recientes primero)
      allComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setComments(allComments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando comentarios');
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (commentId: string, isHidden: boolean, commentType: 'public' | 'private', reason?: string) => {
    try {
      if (commentType === 'public') {
        await moderateComment(commentId, { isHidden, hiddenReason: reason }, currentUser.id);
      } else {
        await moderatePrivateVideoComment(commentId, isHidden, reason, currentUser.id);
      }
      
      await loadComments(); // Recargar comentarios
      setSelectedComment(null);
      setModerationReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error moderando comentario');
    }
  };

  const filteredComments = comments.filter(comment => {
    // Filtrar por visibilidad
    const visibilityMatch = (() => {
      switch (filter) {
        case 'visible':
          return !comment.isHidden;
        case 'hidden':
          return comment.isHidden;
        default:
          return true;
      }
    })();

    // Filtrar por tipo
    const typeMatch = (() => {
      switch (typeFilter) {
        case 'public':
          return comment.type === 'public';
        case 'private':
          return comment.type === 'private';
        default:
          return true;
      }
    })();

    return visibilityMatch && typeMatch;
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-3">
            {onBack && (
              <button
                onClick={onBack}
                className="text-gray-400 hover:text-white transition-colors mr-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <Flag className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-white">Moderación de Comentarios</h2>
          </div>
        </div>

        {/* Filtros mejorados */}
        <div className="mb-8">
          <div className="text-sm text-gray-400 mb-4 font-medium">Filtrar:</div>
          
          {/* Filtros de visibilidad con diseño mejorado */}
          <div className="flex flex-wrap gap-3 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50 backdrop-blur-sm">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-3 rounded-full transition-all duration-200 text-sm font-medium ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/25 transform scale-105'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/70 hover:text-white'
              }`}
            >
              Todos ({comments.length})
            </button>
            <button
              onClick={() => setFilter('visible')}
              className={`px-6 py-3 rounded-full transition-all duration-200 text-sm font-medium flex items-center space-x-2 ${
                filter === 'visible'
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/25 transform scale-105'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/70 hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Visibles ({comments.filter(c => !c.isHidden).length})</span>
            </button>
            <button
              onClick={() => setFilter('hidden')}
              className={`px-6 py-3 rounded-full transition-all duration-200 text-sm font-medium flex items-center space-x-2 ${
                filter === 'hidden'
                  ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg shadow-yellow-500/25 transform scale-105'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/70 hover:text-white'
              }`}
            >
              <EyeOff className="w-4 h-4" />
              <span>Ocultos ({comments.filter(c => c.isHidden).length})</span>
            </button>
          </div>

          {/* Separación de comentarios públicos y privados */}
          <div className="mt-6">
            <div className="text-sm text-gray-400 mb-4 font-medium">Tipo de comentarios:</div>
            <div className="flex flex-wrap gap-3 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50 backdrop-blur-sm">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-6 py-3 rounded-full transition-all duration-200 text-sm font-medium ${
                  typeFilter === 'all'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 transform scale-105'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/70 hover:text-white'
                }`}
              >
                Todos los tipos
              </button>
              <button
                onClick={() => setTypeFilter('public')}
                className={`px-6 py-3 rounded-full transition-all duration-200 text-sm font-medium flex items-center space-x-2 ${
                  typeFilter === 'public'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25 transform scale-105'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/70 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Públicos ({comments.filter(c => c.type === 'public').length})</span>
              </button>
              <button
                onClick={() => setTypeFilter('private')}
                className={`px-6 py-3 rounded-full transition-all duration-200 text-sm font-medium flex items-center space-x-2 ${
                  typeFilter === 'private'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25 transform scale-105'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/70 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Privados ({comments.filter(c => c.type === 'private').length})</span>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Lista de comentarios */}
        <div className="space-y-6">
          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 border border-purple-500/30 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-gray-300">Total</span>
              </div>
              <div className="text-2xl font-bold text-white mt-1">{comments.length}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-gray-300">Públicos</span>
              </div>
              <div className="text-2xl font-bold text-white mt-1">{comments.filter(c => c.type === 'public').length}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-gray-300">Privados</span>
              </div>
              <div className="text-2xl font-bold text-white mt-1">{comments.filter(c => c.type === 'private').length}</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <EyeOff className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-gray-300">Ocultos</span>
              </div>
              <div className="text-2xl font-bold text-white mt-1">{comments.filter(c => c.isHidden).length}</div>
            </div>
          </div>

          {filteredComments.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-2xl p-8 border border-gray-700/50">
                <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No hay comentarios para mostrar</h3>
                <p className="text-gray-500">Los comentarios aparecerán aquí una vez que se publiquen.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComments.map((comment) => (
                <div
                  key={comment.id}
                  className={`bg-gradient-to-br from-gray-800/40 to-gray-700/40 rounded-xl p-6 border transition-all duration-200 hover:shadow-lg backdrop-blur-sm ${
                    comment.isHidden
                      ? 'border-yellow-500/50 bg-yellow-900/10 shadow-yellow-500/20'
                      : comment.type === 'private'
                      ? 'border-purple-500/30 hover:border-purple-400/50'
                      : 'border-blue-500/30 hover:border-blue-400/50'
                  }`}
                >
                  {/* Header del comentario con mejor diseño */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                        comment.type === 'private' 
                          ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                          : 'bg-gradient-to-br from-blue-500 to-cyan-600'
                      }`}>
                        {comment.user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 flex-wrap">
                          <span className="text-white font-semibold text-lg">{comment.user.fullName}</span>
                          <span className="text-gray-400 text-sm">@{comment.user.username}</span>
                          {comment.user.role === 'admin' && (
                            <span className="bg-gradient-to-r from-purple-600 to-purple-700 text-purple-100 px-3 py-1 rounded-full text-xs font-medium">
                              Admin
                            </span>
                          )}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                            comment.type === 'private' 
                              ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-purple-200 border border-purple-500/30'
                              : 'bg-gradient-to-r from-blue-600/30 to-cyan-600/30 text-blue-200 border border-blue-500/30'
                          }`}>
                            {comment.type === 'private' ? (
                              <>
                                <Shield className="w-3 h-3" />
                                <span>Privado</span>
                              </>
                            ) : (
                              <>
                                <Users className="w-3 h-3" />
                                <span>Público</span>
                              </>
                            )}
                          </span>
                          {comment.isHidden && (
                            <span className="bg-gradient-to-r from-yellow-600/30 to-orange-600/30 text-yellow-200 px-3 py-1 rounded-full text-xs font-medium border border-yellow-500/30">
                              Oculto
                            </span>
                          )}
                        </div>
                        <div className="text-gray-400 text-sm flex items-center space-x-2 mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>{getTimeAgo(comment.createdAt)}</span>
                          {comment.isEdited && <span className="text-gray-500">(editado)</span>}
                        </div>
                      </div>
                    </div>

                    {/* Acciones de moderación mejoradas */}
                    <div className="flex space-x-2">
                      {comment.isHidden ? (
                        <button
                          onClick={() => handleModerate(comment.id, false, comment.type)}
                          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 font-medium shadow-lg hover:shadow-green-500/25"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Mostrar</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedComment(comment)}
                          className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 font-medium shadow-lg hover:shadow-yellow-500/25"
                        >
                          <EyeOff className="w-4 h-4" />
                          <span>Ocultar</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Contenido del comentario con mejor diseño */}
                  <div className="mb-6 p-4 bg-gray-900/30 rounded-lg border border-gray-700/50">
                    <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                  </div>

                  {/* Información del perfil */}
                  {(comment as any).profile && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-gray-700/30 to-gray-600/30 rounded-lg border border-gray-600/50">
                      <div className="flex items-center space-x-2 text-sm text-gray-300">
                        <User className="w-4 h-4 text-blue-400" />
                        <span>
                          Comentario en el perfil de <span className="font-medium text-white">{(comment as any).profile.first_name} {(comment as any).profile.last_name}</span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Estadísticas mejoradas */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2 text-green-400">
                        <div className="bg-green-500/20 p-1 rounded-full">
                          <ThumbsUp className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">{comment.likesCount}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-red-400">
                        <div className="bg-red-500/20 p-1 rounded-full">
                          <ThumbsDown className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">{comment.dislikesCount}</span>
                      </div>
                      {comment.repliesCount > 0 && (
                        <div className="flex items-center space-x-2 text-blue-400">
                          <div className="bg-blue-500/20 p-1 rounded-full">
                            <MessageCircle className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium">{comment.repliesCount} respuestas</span>
                        </div>
                      )}
                    </div>

                    {/* Información de moderación */}
                    {comment.isHidden && comment.hiddenReason && (
                      <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg px-3 py-2">
                        <span className="text-yellow-300 text-sm font-medium">
                          Razón: {comment.hiddenReason}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal mejorado para ocultar comentario */}
      {selectedComment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-600 max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-yellow-500/20 p-2 rounded-full">
                <EyeOff className="w-5 h-5 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Ocultar Comentario</h3>
            </div>
            
            <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <p className="text-gray-300 text-sm leading-relaxed">{selectedComment.content}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Razón para ocultar (opcional)
                </label>
                <textarea
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50"
                  rows={3}
                  placeholder="Especifica la razón para ocultar este comentario..."
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => handleModerate(selectedComment.id, true, selectedComment.type, moderationReason)}
                  className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white py-3 px-4 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-yellow-500/25"
                >
                  Ocultar Comentario
                </button>
                <button
                  onClick={() => {
                    setSelectedComment(null);
                    setModerationReason('');
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-all duration-200 font-medium"
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
