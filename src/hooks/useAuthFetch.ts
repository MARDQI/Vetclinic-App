import { authenticatedFetch } from '../utils/auth';

/**
 * Hook personalizado para hacer peticiones autenticadas con JWT
 * Maneja automáticamente el refresh de tokens
 */
export const useAuthFetch = () => {
  const authFetch = async (url: string, options: RequestInit = {}) => {
    try {
      return await authenticatedFetch(url, options);
    } catch (error) {
      if (error instanceof Error && error.message === 'Session expired') {
        // Redirigir al login o mostrar un mensaje
        window.location.href = '/';
      }
      throw error;
    }
  };

  return { authFetch };
};
