import React, { useState } from 'react';
import { Header } from './components/Header';
import { FloatingHearts } from './components/FloatingHearts';
import { Catalog } from './components/Catalog';
import { AddProfileForm } from './components/AddProfileForm';
import { EditProfileForm } from './components/EditProfileForm';
import { ProfileDetail } from './components/ProfileDetail';
import { UserManagement } from './components/UserManagement';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { Modal } from './components/Modal';
import { LoginForm } from './components/LoginForm';
import { Profile } from './types';
import { useProfiles } from './hooks/useProfiles';
import { useModal } from './hooks/useModal';
import { useAuth } from './hooks/useAuth';

type View = 'catalog' | 'add' | 'detail' | 'edit' | 'shared-profile' | 'user-management';

function App() {
  const { currentUser, isAuthenticated, isLoading: authLoading, login, logout } = useAuth();
  
  const {
    profiles,
    loading,
    error,
    addProfile,
    updateProfile,
    deleteProfile,
    toggleLike
  } = useProfiles(currentUser?.id);

  const { modal, hideModal, showSuccess, showError, showConfirm } = useModal();

  const [currentView, setCurrentView] = useState<View>('catalog');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [blurImages, setBlurImages] = useState(false);

  // Manejar URLs compartidas
  React.useEffect(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    
    // Manejar rutas con hash (#/profile/id)
    const hashProfileMatch = hash.match(/^#\/profile\/(.+)$/);
    // Manejar rutas directas (/profile/id)
    const pathProfileMatch = path.match(/^\/profile\/(.+)$/);
    
    const profileId = hashProfileMatch?.[1] || pathProfileMatch?.[1];
    
    if (profileId) {
      // Buscar el perfil por ID
      const profile = profiles.find(p => p.id === profileId);
      if (profile) {
        setSelectedProfile(profile);
        setCurrentView('shared-profile');
        
        // Actualizar meta tags para compartir
        if (window.updateMetaTags) {
          window.updateMetaTags(profile);
        }
        
        // Actualizar la URL sin recargar
        if (pathProfileMatch) {
          window.history.replaceState({}, '', `/#/profile/${profileId}`);
        }
      }
    }
  }, [profiles]);

  // Mostrar spinner de carga inicial de autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-red-900/20 relative">
        <FloatingHearts />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // Mostrar formulario de login si no está autenticado
  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }

  const handleAddProfile = async (profileData: Omit<Profile, 'id' | 'createdAt'>) => {
    try {
      await addProfile(profileData, currentUser?.id);
      setCurrentView('catalog');
      showSuccess(
        '¡Perfil Agregado!',
        'El perfil se ha agregado exitosamente al catálogo.'
      );
    } catch (error) {
      showError(
        'Error al Agregar',
        'No se pudo agregar el perfil. Por favor intenta de nuevo.'
      );
    }
  };

  const handleEditProfile = async (updatedProfile: Profile) => {
    try {
      await updateProfile(updatedProfile);
      setCurrentView('catalog');
      setSelectedProfile(null);
      showSuccess(
        '¡Perfil Actualizado!',
        'Los cambios se han guardado exitosamente.'
      );
    } catch (error) {
      showError(
        'Error al Actualizar',
        'No se pudo actualizar el perfil. Por favor intenta de nuevo.'
      );
    }
  };

  const handleDeleteProfile = async (profile: Profile) => {
    showConfirm(
      'Eliminar Perfil',
      `¿Estás seguro de que quieres eliminar el perfil de ${profile.firstName} ${profile.lastName}? Esta acción no se puede deshacer.`,
      async () => {
        try {
          await deleteProfile(profile.id);
          setCurrentView('catalog');
          setSelectedProfile(null);
          showSuccess(
            '¡Perfil Eliminado!',
            'El perfil se ha eliminado exitosamente del catálogo.'
          );
        } catch (error) {
          showError(
            'Error al Eliminar',
            'No se pudo eliminar el perfil. Por favor intenta de nuevo.'
          );
        }
      },
      'Eliminar',
      'Cancelar'
    );
  };

  const handleToggleLike = async (id: string) => {
    try {
      await toggleLike(id);
    } catch (error) {
      showError(
        'Error de Me Gusta',
        'No se pudo actualizar el me gusta. Por favor intenta de nuevo.'
      );
    }
  };

  const handleProfileClick = (profile: Profile) => {
    setSelectedProfile(profile);
    setCurrentView('detail');
  };

  const handleEditClick = (profile: Profile) => {
    setSelectedProfile(profile);
    setCurrentView('edit');
  };

  const handleViewChange = (view: 'catalog' | 'add') => {
    setCurrentView(view);
    if (view === 'catalog') {
      setSelectedProfile(null);
    }
  };

  const handleBackToCatalog = () => {
    setCurrentView('catalog');
    setSelectedProfile(null);
  };

  const handleUserManagement = () => {
    setCurrentView('user-management');
    setSelectedProfile(null);
  };
  const handleLogout = () => {
    showConfirm(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      () => {
        logout();
      },
      'Cerrar Sesión',
      'Cancelar'
    );
  };

  if (loading && profiles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-red-900/20 relative">
        <FloatingHearts />
        <div className="relative z-10">
          <Header 
            currentView={currentView} 
            onViewChange={handleViewChange}
            currentUser={currentUser}
            onUserManagement={handleUserManagement}
            onLogout={handleLogout}
          />
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-red-900/20 relative">
      <FloatingHearts />
      
      <div className="relative z-10">
        <Header 
          currentView={currentView}
          onViewChange={handleViewChange}
          currentUser={currentUser}
          onUserManagement={handleUserManagement}
          onLogout={handleLogout}
        />

        {error && <ErrorMessage message={error} />}

        <main>
          {currentView === 'catalog' && (
            <Catalog 
              profiles={profiles}
              onProfileClick={handleProfileClick}
              onToggleLike={handleToggleLike}
              blurImages={blurImages}
              onToggleBlurImages={setBlurImages}
            />
          )}

          {currentView === 'add' && (
            <AddProfileForm 
              onSubmit={handleAddProfile}
              onViewChange={handleViewChange}
            />
          )}

          {currentView === 'edit' && selectedProfile && (
            <EditProfileForm 
              profile={selectedProfile}
              currentUser={currentUser}
              onSubmit={handleEditProfile}
              onCancel={handleBackToCatalog}
            />
          )}

          {currentView === 'detail' && selectedProfile && (
            <ProfileDetail 
              profile={selectedProfile}
              currentUser={currentUser}
              onBack={handleBackToCatalog}
              onEdit={handleEditClick}
              onDelete={handleDeleteProfile}
              blurImages={blurImages}
            />
          )}

          {currentView === 'shared-profile' && selectedProfile && (
            <ProfileDetail 
              profile={selectedProfile}
              currentUser={currentUser}
              onBack={() => {
                window.history.pushState({}, '', '/');
                setCurrentView('catalog');
                setSelectedProfile(null);
              }}
              blurImages={blurImages}
            />
          )}
        </main>
          {currentView === 'user-management' && currentUser && (
            <UserManagement 
              currentUser={currentUser}
            />
          )}
      </div>

      {/* Modal Global */}
      <Modal
        isOpen={modal.isOpen}
        onClose={hideModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
      />
    </div>
  );
}

export default App;