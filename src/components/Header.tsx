import React from 'react';
import { Heart, Plus, Grid3X3, LogOut, Users, Menu, X } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  currentView: 'catalog' | 'add' | 'detail' | 'edit';
  onViewChange: (view: 'catalog' | 'add') => void;
  onLogout?: () => void;
  currentUser?: User;
  onUserManagement?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentView, 
  onViewChange, 
  onLogout, 
  currentUser,
  onUserManagement 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMenuItemClick = (action: () => void) => {
    action();
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-gradient-to-r from-red-900 to-red-800 shadow-2xl relative overflow-hidden z-50">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Heart className="w-8 h-8 text-red-400 animate-pulse fill-current" />
            <div>
              <h1 className="text-2xl font-bold text-white">
                The Meat Dealer
              </h1>
              {currentUser && (
                <p className="text-red-200 text-sm hidden sm:block">
                  Bienvenido, {currentUser.fullName}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-4">
              <button
                onClick={() => onViewChange('catalog')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
                  currentView === 'catalog'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                <span>Catálogo</span>
              </button>
              <button
                onClick={() => onViewChange('add')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
                  currentView === 'add'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
              {currentUser?.role === 'admin' && onUserManagement && (
                <button
                  onClick={onUserManagement}
                  className="px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 text-white hover:bg-white/10"
                >
                  <Users className="w-4 h-4" />
                  <span>Usuarios</span>
                </button>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            {/* Desktop Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="hidden md:flex px-4 py-2 rounded-lg font-medium transition-all duration-300 items-center space-x-2 text-white hover:bg-red-600/50 border border-red-600/50 hover:border-red-600"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
                <span>Salir</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-gradient-to-r from-red-900 to-red-800 border-t border-red-700/50 shadow-2xl">
            <div className="px-4 py-4 space-y-2">
              {/* User Info */}
              {currentUser && (
                <div className="pb-3 mb-3 border-b border-red-700/50">
                  <p className="text-red-200 text-sm">
                    Bienvenido, {currentUser.fullName}
                  </p>
                  <p className="text-red-300 text-xs">
                    @{currentUser.username} • {currentUser.role === 'admin' ? 'Administrador' : 'Usuario'}
                  </p>
                </div>
              )}

              {/* Navigation Items */}
              <button
                onClick={() => handleMenuItemClick(() => onViewChange('catalog'))}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  currentView === 'catalog'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Grid3X3 className="w-5 h-5" />
                <span>Catálogo</span>
              </button>

              <button
                onClick={() => handleMenuItemClick(() => onViewChange('add'))}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  currentView === 'add'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Plus className="w-5 h-5" />
                <span>Agregar Perfil</span>
              {currentUser?.role === 'admin' && onUserManagement && (
                <button
                  onClick={() => handleMenuItemClick(onUserManagement)}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 text-white hover:bg-white/10"
                >
                  <Users className="w-5 h-5" />
                  <span>Gestión de Usuarios</span>
                </button>
              )}
              </button>
              {/* Logout Button */}
              {onLogout && (
                <button
                  onClick={() => handleMenuItemClick(onLogout)}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 text-white hover:bg-red-600/50 border border-red-600/50 hover:border-red-600 mt-4"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Cerrar Sesión</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};