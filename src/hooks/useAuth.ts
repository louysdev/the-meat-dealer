import { useState, useEffect } from 'react';
import { User } from '../types';
import { authenticateUser } from '../services/userService';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isAuthenticated = currentUser !== null;

  // Verificar si ya está autenticado al cargar
  useEffect(() => {
    const checkAuth = () => {
      const authData = localStorage.getItem('meatdealer_auth');
      if (authData) {
        try {
          const { timestamp, user } = JSON.parse(authData);
          const now = Date.now();
          const sessionDuration = 24 * 60 * 60 * 1000; // 24 horas
          
          // Verificar si la sesión no ha expirado
          if (user && (now - timestamp) < sessionDuration) {
            setCurrentUser({
              ...user,
              createdAt: new Date(user.createdAt),
              updatedAt: new Date(user.updatedAt)
            });
          } else {
            // Sesión expirada, limpiar
            localStorage.removeItem('meatdealer_auth');
            setCurrentUser(null);
          }
        } catch (error) {
          console.error('Error parsing auth data:', error);
          localStorage.removeItem('meatdealer_auth');
          setCurrentUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Primero intentar con el sistema de base de datos
      let user = await authenticateUser(username, password);
      
      // Si no funciona y son las credenciales del admin legacy, usar el método legacy
      if (!user && username === 'admin' && password === 'meatdealer2025') {
        const authData = {
          user: {
            id: 'legacy-admin',
            fullName: 'Administrador Principal',
            username: 'admin',
            role: 'admin' as const,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          timestamp: Date.now()
        };
        localStorage.setItem('meatdealer_auth', JSON.stringify(authData));
        setCurrentUser(authData.user);
        return true;
      }
      
      if (user) {
        const authData = {
          user: user,
          timestamp: Date.now()
        };
        localStorage.setItem('meatdealer_auth', JSON.stringify(authData));
        setCurrentUser(user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error en login:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('meatdealer_auth');
    setCurrentUser(null);
  };

  return {
    currentUser,
    isAuthenticated,
    isLoading,
    login,
    logout
  };
};