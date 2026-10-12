import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

export type AppRoute =
  | '/login'
  | '/dashboard'
  | '/clientes'
  | '/planos'
  | '/assinaturas'
  | '/pagamentos';

interface RouterContextValue {
  route: AppRoute;
  params: Record<string, string>;
  navigate: (path: string) => void;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

function parseHash(hashStr: string): { route: AppRoute; params: Record<string, string> } {
  const clean = hashStr.replace(/^#/, '') || '/dashboard';
  const [pathname, queryString] = clean.split('?');

  const params: Record<string, string> = {};
  if (queryString) {
    const searchParams = new URLSearchParams(queryString);
    searchParams.forEach((val, key) => {
      params[key] = val;
    });
  }

  const validRoutes: AppRoute[] = [
    '/login',
    '/dashboard',
    '/clientes',
    '/planos',
    '/assinaturas',
    '/pagamentos',
  ];

  const matched = validRoutes.find((r) => r === pathname) || '/dashboard';
  return { route: matched, params };
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [{ route, params }, setRouteState] = useState(() =>
    parseHash(window.location.hash)
  );

  const navigate = useCallback((targetPath: string) => {
    window.location.hash = targetPath;
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseHash(window.location.hash);
      setRouteState(parsed);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Route protection
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated && route !== '/login') {
      window.location.hash = '/login';
    } else if (isAuthenticated && route === '/login') {
      window.location.hash = '/dashboard';
    }
  }, [isAuthenticated, authLoading, route]);

  return (
    <RouterContext.Provider value={{ route, params, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter(): RouterContextValue {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
}
