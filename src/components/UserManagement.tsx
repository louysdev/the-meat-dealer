import React, { useState, useEffect } from 'react';
import { Users, Edit, Trash2, UserCheck, UserX, Eye, EyeOff, UserRoundPlus, ArrowLeft, Video, VideoOff, MessageCircle } from 'lucide-react';
import { User, CreateUserData } from '../types';
import { getUsers, createUser, updateUser, toggleUserStatus, togglePrivateVideoAccess, deleteUser } from '../services/userService';
import { Modal } from './Modal';
import { LoadingSpinner } from './LoadingSpinner';

interface UserManagementProps {
  currentUser: User;
  onBack?: () => void;
  onNavigateToModeration?: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser, onBack, onNavigateToModeration }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'confirm';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  const [formData, setFormData] = useState<CreateUserData>({
    fullName: '',
    username: '',
    password: '',
    role: 'user',
    canAccessPrivateVideos: false
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createUser(formData, currentUser.id);
      await loadUsers();
      setShowCreateForm(false);
      setFormData({ fullName: '', username: '', password: '', role: 'user', canAccessPrivateVideos: false });
      showModal('Usuario Creado', 'El usuario se ha creado exitosamente.', 'success');
    } catch (err) {
      showModal('Error', err instanceof Error ? err.message : 'Error creando usuario', 'error');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser) return;

    try {
      await updateUser(editingUser.id, formData);
      await loadUsers();
      setEditingUser(null);
      setFormData({ fullName: '', username: '', password: '', role: 'user', canAccessPrivateVideos: false });
      showModal('Usuario Actualizado', 'Los cambios se han guardado exitosamente.', 'success');
    } catch (err) {
      showModal('Error', err instanceof Error ? err.message : 'Error actualizando usuario', 'error');
    }
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      await toggleUserStatus(userId, !isActive);
      await loadUsers();
      showModal(
        'Estado Actualizado',
        `El usuario ha sido ${!isActive ? 'activado' : 'desactivado'} exitosamente.`,
        'success'
      );
    } catch (err) {
      showModal('Error', err instanceof Error ? err.message : 'Error actualizando estado', 'error');
    }
  };

  const handleTogglePrivateVideoAccess = async (userId: string, hasAccess: boolean) => {
    try {
      await togglePrivateVideoAccess(userId, !hasAccess);
      await loadUsers();
      showModal(
        'Acceso Actualizado',
        `El acceso a videos privados ha sido ${!hasAccess ? 'habilitado' : 'deshabilitado'} exitosamente.`,
        'success'
      );
    } catch (err) {
      showModal('Error', err instanceof Error ? err.message : 'Error actualizando acceso', 'error');
    }
  };

  const handleDeleteUser = (user: User) => {
    showModal(
      'Eliminar Usuario',
      `¿Estás seguro de que quieres eliminar al usuario "${user.fullName}"? Esta acción no se puede deshacer.`,
      'confirm',
      async () => {
        try {
          await deleteUser(user.id);
          await loadUsers();
          showModal('Usuario Eliminado', 'El usuario se ha eliminado exitosamente.', 'success');
        } catch (err) {
          showModal('Error', err instanceof Error ? err.message : 'Error eliminando usuario', 'error');
        }
      }
    );
  };

  const showModal = (title: string, message: string, type: 'success' | 'error' | 'confirm', onConfirm?: () => void) => {
    setModal({ isOpen: true, title, message, type, onConfirm });
  };

  const hideModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName,
      username: user.username,
      password: '',
      role: user.role,
      canAccessPrivateVideos: user.canAccessPrivateVideos
    });
    setShowCreateForm(true);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setShowCreateForm(false);
    setFormData({ fullName: '', username: '', password: '', role: 'user', canAccessPrivateVideos: false });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            {onBack && (
              <button
                onClick={onBack}
                className="text-gray-400 hover:text-white transition-colors mr-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <Users className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Gestión de Usuarios</h2>
          </div>
          <div className="flex space-x-3">
            {onNavigateToModeration && (
              <button
                onClick={onNavigateToModeration}
                className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Moderación</span>
              </button>
            )}
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white  px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <UserRoundPlus className="w-4 h-4" />
              <span>Crear</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="bg-gray-800/50 rounded-xl p-6 mb-8 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
            </h3>
            <form onSubmit={editingUser ? handleEditUser : handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre de Usuario *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={!editingUser}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Rol *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const newRole = e.target.value as 'admin' | 'user';
                      setFormData({ 
                        ...formData, 
                        role: newRole,
                        canAccessPrivateVideos: newRole === 'admin' ? true : formData.canAccessPrivateVideos
                      });
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              
              {/* Menú desplegable para acceso a videos privados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Acceso a Videos Privados *
                  </label>
                  <select
                    value={formData.canAccessPrivateVideos ? 'con_acceso' : 'sin_acceso'}
                    disabled={formData.role === 'admin'}
                    onChange={(e) => {
                      const hasAccess = e.target.value === 'con_acceso';
                      setFormData({ 
                        ...formData, 
                        canAccessPrivateVideos: hasAccess 
                      });
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="sin_acceso">Sin Acceso</option>
                    <option value="con_acceso">Con Acceso</option>
                  </select>
                  {formData.role === 'admin' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Los administradores siempre tienen acceso automático
                    </p>
                  )}
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  {editingUser ? 'Actualizar' : 'Crear'} Usuario
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-gray-300 font-medium py-3 px-4">Usuario</th>
                <th className="text-gray-300 font-medium py-3 px-4">Nombre de Usuario</th>
                <th className="text-gray-300 font-medium py-3 px-4">Rol</th>
                <th className="text-gray-300 font-medium py-3 px-4">Estado</th>
                <th className="text-gray-300 font-medium py-3 px-4">Videos Privados</th>
                <th className="text-gray-300 font-medium py-3 px-4">Creado</th>
                <th className="text-gray-300 font-medium py-3 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                  <td className="py-4 px-4">
                    <div>
                      <div className="text-white font-medium">{user.fullName}</div>
                      <div className="text-gray-400 text-sm">ID: {user.id.slice(0, 8)}...</div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-300">@{user.username}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-600/30'
                        : 'bg-blue-600/20 text-blue-300 border border-blue-600/30'
                    }`}>
                      {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.isActive
                        ? 'bg-green-600/20 text-green-300 border border-green-600/30'
                        : 'bg-red-600/20 text-red-300 border border-red-600/30'
                    }`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.canAccessPrivateVideos || user.role === 'admin'
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-600/30'
                        : 'bg-gray-600/20 text-gray-300 border border-gray-600/30'
                    }`}>
                      {user.canAccessPrivateVideos || user.role === 'admin' ? 'Con Acceso' : 'Sin Acceso'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-400 text-sm">
                    {user.createdAt.toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEdit(user)}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-600/20 rounded-lg transition-colors"
                        title="Editar usuario"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user.id, user.isActive)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.isActive
                            ? 'text-red-400 hover:text-red-300 hover:bg-red-600/20'
                            : 'text-green-400 hover:text-green-300 hover:bg-green-600/20'
                        }`}
                        title={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                      >
                        {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleTogglePrivateVideoAccess(user.id, user.canAccessPrivateVideos)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.canAccessPrivateVideos
                              ? 'text-red-400 hover:text-red-300 hover:bg-red-600/20'
                              : 'text-green-400 hover:text-green-300 hover:bg-green-600/20'
                          }`}
                          title={user.canAccessPrivateVideos ? 'Revocar acceso a videos privados' : 'Conceder acceso a videos privados'}
                        >
                          {user.canAccessPrivateVideos ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                        </button>
                      )}
                      {user.id !== currentUser.id && (
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-600/20 rounded-lg transition-colors"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No hay usuarios registrados</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={hideModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />
    </div>
  );
};