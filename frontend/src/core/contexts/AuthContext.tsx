import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';

const REFRESH_TOKEN_KEY = 'pfm_refresh_token';

interface User {
  id: string;
  email: string;
  name: string;
  provider: 'local' | 'google';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  login: (token: string, refreshToken?: string, provider?: 'local' | 'google') => void;
  logout: () => void;
}

interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  exp: number;
}

// Module-level variable to hold the token outside React state for the axios interceptor
let _accessToken: string | null = null;

export function getAccessToken(): string | null {
  return _accessToken;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isRefreshingRef = useRef(false);

  const setAccessToken = useCallback((token: string | null) => {
    _accessToken = token;
    setAccessTokenState(token);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setAccessToken(null);
    setUser(null);
  }, [setAccessToken]);

  const refreshAccessToken = useCallback(async () => {
    // Guard: evitar refrescos concurrentes (ej. React StrictMode double-mount)
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    try {
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!storedRefreshToken) {
        clearAuth();
        setIsLoading(false);
        return;
      }

      const url = '/api/auth/refresh';
      const options: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      };

      // Retry hasta 3 veces con backoff exponencial:
      //   - Errores de red (ECONNREFUSED) → reintenta
      //   - HTTP 401 → NO reintenta (refresh token genuinamente inválido)
      //   - Otros HTTP (404, 500) → reintenta (error transitorio del backend)
      //   - Si se agotan los reintentos sin 401 → NO clearAuth (la sesión sigue viva)
      const MAX_RETRIES = 3;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const response = await fetch(url, options);

          if (response.ok) {
            const data = await response.json();
            const decoded = jwtDecode<JwtPayload>(data.accessToken);

            setAccessToken(data.accessToken);
            if (data.refreshToken) {
              localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
            }

            setUser({
              id: decoded.sub,
              email: decoded.email,
              name: decoded.name,
              provider: data.user?.provider || 'local',
            });
            setIsLoading(false);
            return; // éxito
          }

          // HTTP 401 = refresh token genuinamente inválido → no reintentar
          if (response.status === 401) {
            clearAuth();
            setIsLoading(false);
            return;
          }

          // Otros HTTP (404, 500, etc.) — reintentar
        } catch {
          // Error de red (ECONNREFUSED, DNS, etc.) — reintentar
        }

        if (attempt < MAX_RETRIES - 1) {
          // Esperar con backoff: 500ms, 1000ms, 2000ms
          await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
        }
      }

      // Se agotaron los reintentos sin un 401 definitivo
      // No clearAuth — la sesión puede seguir viva (token en localStorage)
      // El interceptor de Axios manejará 401s en próximos llamados
      setIsLoading(false);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [clearAuth, setAccessToken]);

  // On mount: try to restore session via refresh token
  useEffect(() => {
    refreshAccessToken();
  }, [refreshAccessToken]);

  // Listen for auth:unauthorized events from the API interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuth();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [clearAuth]);

  const login = useCallback((token: string, newRefreshToken?: string, provider: 'local' | 'google' = 'local') => {
    setAccessToken(token);

    if (newRefreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
    }

    const decoded = jwtDecode<JwtPayload>(token);
    setUser({
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      provider,
    });
  }, [setAccessToken]);

  const logout = useCallback(() => {
    // Try to invalidate refresh token on server
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (storedRefreshToken) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      }).catch(() => {
        // Best-effort — ignore network errors
      });
    }

    clearAuth();
  }, [clearAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        accessToken,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
