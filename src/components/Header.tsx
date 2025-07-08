import React from 'react';
import { Heart, Plus, Grid3X3, LogOut, Users } from 'lucide-react';
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
  return (
    <header className="bg-gradient-to-r from-red-900 to-red-800 shadow-2xl relative overflow-hidden">
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
                <p className="text-red-200 text-sm">
                  Bienvenido, {currentUser.fullName}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <nav className="flex space-x-4">
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

            {onLogout && (
              <button
                onClick={onLogout}
                className="px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 text-white hover:bg-red-600/50 border border-red-600/50 hover:border-red-600"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};