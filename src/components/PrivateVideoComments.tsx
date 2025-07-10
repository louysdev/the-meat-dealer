import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, ThumbsUp, ThumbsDown, Reply, Shield } from 'lucide-react';
import { PrivateVideoComment, User } from '../types';
import { getPrivateVideoComments, createPrivateVideoComment } from '../services/privateVideoService';
import { getTimeAgo } from '../utils/dateUtils';

interface PrivateVideoCommentsProps {
  profileId: string;
  currentUser: User | null;
}

export const PrivateVideoComments: React.FC<PrivateVideoCommentsProps> = ({
  profileId,
  currentUser
}) => {
  const [comments, setComments] = useState<PrivateVideoComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [profileId, currentUser?.id]);

  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPrivateVideoComments(profileId, currentUser?.id);
      setComments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando comentarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUser || submitting) return;

    try {
      setSubmitting(true);
      const comment = await createPrivateVideoComment({
        profileId,
        content: newComment.trim()
      }, currentUser.id);
      
      setComments(prev => [comment, ...prev]);
      setNewComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error enviando comentario');
    } finally {
      setSubmitting(false);
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
            <div
              key={comment.id}
              className="bg-gray-800/30 rounded-lg p-4 border border-gray-700"
            >
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
                    </div>
                    <div className="text-gray-400 text-sm">
                      {getTimeAgo(comment.createdAt)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contenido del comentario */}
              <div className="mb-3">
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {comment.content}
                </p>
              </div>

              {/* Acciones del comentario */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button className="flex items-center space-x-1 text-gray-400 hover:text-green-300 transition-colors">
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-sm">{comment.likesCount}</span>
                  </button>
                  <button className="flex items-center space-x-1 text-gray-400 hover:text-red-300 transition-colors">
                    <ThumbsDown className="w-4 h-4" />
                    <span className="text-sm">{comment.dislikesCount}</span>
                  </button>
                </div>

                {currentUser && (
                  <button className="flex items-center space-x-1 text-gray-400 hover:text-purple-300 transition-colors">
                    <Reply className="w-4 h-4" />
                    <span className="text-sm">Responder</span>
                  </button>
                )}
              </div>
            </div>
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