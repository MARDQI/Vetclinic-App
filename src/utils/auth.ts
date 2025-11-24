// Utilidades para manejo de JWT
export const setTokens = (access: string, refresh: string) => {
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refreshToken');
};

export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

// Función para verificar si el token está expirado
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convertir a milisegundos
    return Date.now() >= expirationTime;
  } catch (error) {
    return true;
  }
};

// Función para refrescar el token
export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/accounts/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('accessToken', data.access);
      
      // Si el backend devuelve un nuevo refresh token (rotation)
      if (data.refresh) {
        localStorage.setItem('refreshToken', data.refresh);
      }
      
      return data.access;
    } else {
      // Si el refresh token también está expirado, limpiar todo
      clearTokens();
      return null;
    }
  } catch (error) {
    console.error('Error al refrescar el token:', error);
    clearTokens();
    return null;
  }
};

// Función para hacer fetch con refresh automático
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  let accessToken = getAccessToken();

  // Verificar si el token está expirado
  if (accessToken && isTokenExpired(accessToken)) {
    accessToken = await refreshAccessToken();
    
    if (!accessToken) {
      throw new Error('Session expired');
    }
  }

  // Agregar el token de autorización
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${accessToken}`,
  };

  const response = await fetch(url, { ...options, headers });

  // Si obtenemos un 401, intentar refrescar el token
  if (response.status === 401) {
    accessToken = await refreshAccessToken();
    
    if (accessToken) {
      // Reintentar la petición con el nuevo token
      const retryHeaders = {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
      };
      return fetch(url, { ...options, headers: retryHeaders });
    } else {
      throw new Error('Session expired');
    }
  }

  return response;
};
