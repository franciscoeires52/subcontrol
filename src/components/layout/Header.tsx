import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { resetToSeeds } from '@/services';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  CreditCard,
  LogOut,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  onDataReset?: () => void;
}

export function Header({ onDataReset }: HeaderProps) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      await resetToSeeds();
      toast.success('Dados mock restaurados com sucesso para os valores padrão!');
      setShowResetConfirm(false);
      if (onDataReset) onDataReset();
    } catch {
      toast.error('Erro ao restaurar dados mock.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleConfirmLogout = () => {
    logout();
    toast.info('Sessão encerrada com sucesso.');
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <CreditCard className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white">
                  SubControl
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Mock Local
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-zinc-400 -mt-0.5">
                Gestão de Assinaturas Recorrentes
              </p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Reset mock data button */}
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors"
              title="Restaurar dados iniciais do mock"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Resetar Mock</span>
            </button>

            {/* User profile & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-indigo-400">
                {user?.avatarLetter || 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-medium text-zinc-200 leading-none">
                  {user?.name || 'Administrador'}
                </p>
                <p className="text-[11px] text-zinc-500 leading-none mt-1">
                  {user?.email || 'admin@subcontrol.app'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-rose-300 bg-zinc-900 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-900/40 transition-colors flex items-center gap-1.5"
                title="Sair do sistema"
                aria-label="Sair do sistema"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Sair do Sistema</span>
                <span className="sm:hidden">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Confirm Logout Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        title="Sair do Sistema?"
        message="Tem certeza de que deseja encerrar sua sessão? Você poderá entrar novamente a qualquer momento com qualquer e-mail."
        confirmText="Sim, Sair"
        cancelText="Permanecer"
        isDangerous={true}
      />

      {/* Confirm Reset Dialog */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetData}
        title="Restaurar dados de teste?"
        message="Isso irá resetar os clientes, planos, assinaturas e pagamentos de volta para o conjunto de dados demonstrativo inicial."
        confirmText="Restaurar Dados"
        cancelText="Cancelar"
        isLoading={isResetting}
      />
    </>
  );
}
