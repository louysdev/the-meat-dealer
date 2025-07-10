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
};

export const CommentModeration: React.FC<CommentModerationProps> = ({ currentUser, onBack }) => {
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

        {/* Filtros integrados con estilo rojo oscuro */}
        <div className="mb-8">
          <div className="text-sm text-gray-400 mb-4 font-medium">Filtrar:</div>
          
          {/* Barra de filtros unificada */}
          <div className="bg-black/40 rounded-xl border border-red-900/30 p-4 backdrop-blur-sm">
            {/* Primera fila: Estado de visibilidad */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                  filter === 'all'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/25'
                    : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/80 hover:text-white border border-gray-700/50'
                }`}
              >
                Todos ({comments.length})
              </button>
              <button
                onClick={() => setFilter('visible')}
                className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium flex items-center space-x-2 ${
                  filter === 'visible'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/25'
                    : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/80 hover:text-white border border-gray-700/50'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Visibles ({comments.filter(c => !c.isHidden).length})</span>
              </button>
              <button
                onClick={() => setFilter('hidden')}
                className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium flex items-center space-x-2 ${
                  filter === 'hidden'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/25'
                    : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/80 hover:text-white border border-gray-700/50'
                }`}
              >
                <EyeOff className="w-4 h-4" />
                <span>Ocultos ({comments.filter(c => c.isHidden).length})</span>
              </button>
            </div>

            {/* Segunda fila: Tipo de comentarios */}
            <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-700/50">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                  typeFilter === 'all'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/25'
                    : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/80 hover:text-white border border-gray-700/50'
                }`}
              >
                Todos los tipos
              </button>
              <button
                onClick={() => setTypeFilter('public')}
                className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium flex items-center space-x-2 ${
                  typeFilter === 'public'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/25'
                    : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/80 hover:text-white border border-gray-700/50'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Públicos ({comments.filter(c => c.type === 'public').length})</span>
              </button>
              <button
                onClick={() => setTypeFilter('private')}
                className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium flex items-center space-x-2 ${
                  typeFilter === 'private'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/25'
                    : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/80 hover:text-white border border-gray-700/50'
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
          {/* Estadísticas rápidas con tema rojo oscuro */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-black/30 border border-red-900/30 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-red-400" />
                <span className="text-sm text-gray-300">Total</span>
              </div>
              <div className="text-2xl font-bold text-white mt-1">{comments.length}</div>
            </div>
            <div className="bg-black/30 border border-gray-700/50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-300">Públicos</span>
              </div>
              <div className="text-2xl font-bold text-white mt-1">{comments.filter(c => c.type === 'public').length}</div>
            </div>
            <div className="bg-black/30 border border-gray-700/50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-300">Privados</span>
              </div>
              <div className="text-2xl font-bold text-white mt-1">{comments.filter(c => c.type === 'private').length}</div>
            </div>
            <div className="bg-black/30 border border-red-900/30 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <EyeOff className="w-5 h-5 text-red-400" />
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
            <div className="space-y-3 sm:space-y-4">
              {filteredComments.map((comment) => (
                <div
                  key={comment.id}
                  className={`bg-black/40 rounded-lg p-3 sm:p-6 border transition-all duration-200 hover:shadow-lg backdrop-blur-sm ${
                    comment.isHidden
                      ? 'border-red-700/50 bg-red-900/10 shadow-red-500/20'
                      : comment.type === 'private'
                      ? 'border-gray-700/50 hover:border-red-500/30'
                      : 'border-gray-700/50 hover:border-gray-500/50'
                  }`}
                >
                  {/* Header del comentario */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4 space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0 ${
                        comment.type === 'private' 
                          ? 'bg-gradient-to-br from-red-700 to-red-800'
                          : 'bg-gradient-to-br from-gray-700 to-gray-800'
                      }`}>
                        {comment.user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-1 sm:gap-0">
                          <span className="text-white font-semibold text-base sm:text-lg truncate">{comment.user.fullName}</span>
                          <span className="text-gray-400 text-xs sm:text-sm">@{comment.user.username}</span>
                          {comment.user.role === 'admin' && (
                            <span className="bg-red-600 text-red-100 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 flex-wrap gap-1 mt-1">
                          <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                            comment.type === 'private' 
                              ? 'bg-red-600/20 text-red-300 border border-red-600/30'
                              : 'bg-gray-600/20 text-gray-300 border border-gray-600/30'
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
                            <span className="bg-red-600/30 text-red-200 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium border border-red-600/50">
                              Oculto
                            </span>
                          )}
                        </div>
                        <div className="text-gray-400 text-xs sm:text-sm flex items-center space-x-2 mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>{getTimeAgo(comment.createdAt)}</span>
                          {comment.isEdited && <span className="text-gray-500">(editado)</span>}
                        </div>
                      </div>
                    </div>

                    {/* Acciones de moderación */}
                    <div className="flex space-x-2 self-start sm:self-auto">
                      {comment.isHidden ? (
                        <button
                          onClick={() => handleModerate(comment.id, false, comment.type)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all duration-200 flex items-center space-x-1 sm:space-x-2 font-medium text-sm"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Mostrar</span>
                          <span className="sm:hidden">Ver</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedComment(comment)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all duration-200 flex items-center space-x-1 sm:space-x-2 font-medium text-sm"
                        >
                          <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Ocultar</span>
                          <span className="sm:hidden">Ocultar</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Contenido del comentario */}
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                    <p className="text-gray-200 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">{comment.content}</p>
                  </div>

                  {/* Información del perfil */}
                  {comment.profile && (
                    <div className={`mb-3 sm:mb-4 p-3 sm:p-4 rounded-lg border ${
                      comment.type === 'private' 
                        ? 'bg-red-900/20 border-red-700/50' 
                        : 'bg-gray-800/30 border-gray-700/50'
                    }`}>
                      <div className="flex items-start space-x-2 text-xs sm:text-sm text-gray-300">
                        {comment.type === 'private' ? (
                          <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        )}
                        <span className="break-words">
                          {comment.type === 'private' ? (
                            <>Comentario en el perfil privado de <span className="font-medium text-white">{(comment.profile as any).name}</span></>
                          ) : (
                            <>Comentario en el perfil de <span className="font-medium text-white">{(comment.profile as any).first_name} {(comment.profile as any).last_name}</span></>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Estadísticas */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 sm:pt-4 border-t border-gray-700/50 space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-4 sm:space-x-6">
                      <div className="flex items-center space-x-2 text-green-400">
                        <div className="bg-green-500/20 p-1 rounded-full">
                          <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium">{comment.likesCount}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-red-400">
                        <div className="bg-red-500/20 p-1 rounded-full">
                          <ThumbsDown className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium">{comment.dislikesCount}</span>
                      </div>
                      {comment.repliesCount > 0 && (
                        <div className="flex items-center space-x-2 text-gray-400">
                          <div className="bg-gray-500/20 p-1 rounded-full">
                            <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                          </div>
                          <span className="text-xs sm:text-sm font-medium">{comment.repliesCount} respuestas</span>
                        </div>
                      )}
                    </div>

                    {/* Información de moderación */}
                    {comment.isHidden && comment.hiddenReason && (
                      <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 self-start sm:self-auto">
                        <span className="text-red-300 text-xs sm:text-sm font-medium break-words">
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

      {/* Modal para ocultar comentario con tema rojo oscuro */}
      {selectedComment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-2xl border border-red-900/30 max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="bg-red-600/20 p-2 rounded-full border border-red-600/30">
                <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">Ocultar Comentario</h3>
            </div>
            
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <p className="text-gray-300 text-sm leading-relaxed break-words">{selectedComment.content}</p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-3">
                  Razón para ocultar (opcional)
                </label>
                <textarea
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 sm:px-4 sm:py-3 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                  rows={3}
                  placeholder="Especifica la razón para ocultar este comentario..."
                />
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
                <button
                  onClick={() => handleModerate(selectedComment.id, true, selectedComment.type, moderationReason)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 sm:py-3 px-4 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base"
                >
                  Ocultar Comentario
                </button>
                <button
                  onClick={() => {
                    setSelectedComment(null);
                    setModerationReason('');
                  }}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2.5 sm:py-3 px-4 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base"
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
