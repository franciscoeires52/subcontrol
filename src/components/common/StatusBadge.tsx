import React from 'react';
import { CustomerStatus, SubscriptionStatus } from '@/services/types';

interface StatusBadgeProps {
  status: CustomerStatus | SubscriptionStatus | 'active_plan' | 'inactive_plan';
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  switch (status) {
    case 'ativo':
    case 'active_plan':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {status === 'active_plan' ? 'Ativo' : 'Ativo'}
        </span>
      );

    case 'inativo':
    case 'inactive_plan':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-900 text-zinc-400 border border-zinc-800 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
          {status === 'inactive_plan' ? 'Inativo' : 'Inativo'}
        </span>
      );

    case 'ativa':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Ativa
        </span>
      );

    case 'vencida':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-950/60 text-rose-400 border border-rose-800/40 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
          Vencida
        </span>
      );

    case 'cancelada':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-900 text-zinc-400 border border-zinc-800 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
          Cancelada
        </span>
      );

    default:
      return null;
  }
}
