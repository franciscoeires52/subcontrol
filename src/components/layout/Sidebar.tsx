import React from 'react';
import { useRouter, AppRoute } from '@/context/RouterContext';
import {
  LayoutDashboard,
  Users,
  Layers,
  Repeat,
  Receipt,
  Database,
} from 'lucide-react';

interface NavItem {
  name: string;
  route: AppRoute;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', route: '/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', route: '/clientes', icon: Users },
  { name: 'Planos', route: '/planos', icon: Layers },
  { name: 'Assinaturas', route: '/assinaturas', icon: Repeat },
  { name: 'Pagamentos', route: '/pagamentos', icon: Receipt },
];

export function Sidebar() {
  const { route, navigate } = useRouter();

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-zinc-800/80 bg-zinc-950/60 p-4 min-h-[calc(100vh-4rem)] justify-between">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Navegação Principal
          </p>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = route === item.route;

              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => navigate(item.route)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="space-y-3">
        {/* Supabase Ready Card */}
        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-left">
          <div className="flex items-center gap-2 mb-1.5">
            <Database className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-zinc-200">Supabase Ready</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Arquitetura desacoplada via <code className="text-indigo-300">/services</code>. O stub está preparado para plugar banco real sem reescrever telas.
          </p>
        </div>
      </div>
    </aside>
  );
}
