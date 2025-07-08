import { useState, useEffect } from 'react';

// Credenciales maestras (en producción deberían estar en variables de entorno)
const MASTER_CREDENTIALS = {
  username: 'admin',
  password: 'meatdealer2025'
};

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Verificar si ya está autenticado al cargar
  useEffect(() => {
    const checkAuth = () => {
      const authData = localStorage.getItem('meatdealer_auth');
      if (authData) {
        try {
          const { timestamp, authenticated } = JSON.parse(authData);
          const now = Date.now();
          const sessionDuration = 24 * 60 * 60 * 1000; // 24 horas
          
          // Verificar si la sesión no ha expirado
          if (authenticated && (now - timestamp) < sessionDuration) {
            setIsAuthenticated(true);
          } else {
            // Sesión expirada, limpiar
            localStorage.removeItem('meatdealer_auth');
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Error parsing auth data:', error);
          localStorage.removeItem('meatdealer_auth');
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = (username: string, password: string): boolean => {
    if (username === MASTER_CREDENTIALS.username && password === MASTER_CREDENTIALS.password) {
      const authData = {
        authenticated: true,
        timestamp: Date.now(),
        username: username
      };
      localStorage.setItem('meatdealer_auth', JSON.stringify(authData));
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('meatdealer_auth');
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    isLoading,
    login,
    logout
  };
};