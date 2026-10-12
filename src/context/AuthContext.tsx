import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserSession {
  email: string;
  name: string;
  avatarLetter: string;
  loggedInAt: string;
}

interface AuthContextValue {
  user: UserSession | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AUTH_STORAGE_KEY = 'subcontrol_auth_session';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse auth session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string) => {
    // Artificial small delay for realistic UX
    await new Promise((resolve) => setTimeout(resolve, 400));
    const cleanEmail = email.trim() || 'admin@subcontrol.app';
    const name = cleanEmail.split('@')[0];
    const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

    const session: UserSession = {
      email: cleanEmail,
      name: capitalizedName || 'Administrador',
      avatarLetter: capitalizedName.charAt(0).toUpperCase() || 'A',
      loggedInAt: new Date().toISOString(),
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    setUser(session);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
