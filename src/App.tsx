import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { RouterProvider, useRouter } from './context/RouterContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { CustomersView } from './views/CustomersView';
import { PlansView } from './views/PlansView';
import { SubscriptionsView } from './views/SubscriptionsView';
import { PaymentsView } from './views/PaymentsView';
import { LoadingSpinner } from './components/common/LoadingSpinner';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const { route } = useRouter();
  const [dataVersion, setDataVersion] = useState(0);

  const handleDataReset = () => {
    setDataVersion((v) => v + 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando SubControl..." />
      </div>
    );
  }

  // Se não estiver autenticado ou na rota de login, exibe tela de login sem layout
  if (!isAuthenticated || route === '/login') {
    return <LoginView />;
  }

  // Rotas autenticadas dentro do AppLayout
  return (
    <AppLayout onDataReset={handleDataReset}>
      {route === '/dashboard' && <DashboardView key={dataVersion} />}
      {route === '/clientes' && <CustomersView key={dataVersion} />}
      {route === '/planos' && <PlansView key={dataVersion} />}
      {route === '/assinaturas' && <SubscriptionsView key={dataVersion} />}
      {route === '/pagamentos' && <PaymentsView key={dataVersion} />}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider>
          <AppContent />
        </RouterProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
