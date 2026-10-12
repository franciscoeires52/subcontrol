import React from 'react';
import { useRouter, AppRoute } from '@/context/RouterContext';
import {
  LayoutDashboard,
  Users,
  Layers,
  Repeat,
  Receipt,
} from 'lucide-react';

interface BottomNavItem {
  name: string;
  route: AppRoute;
  icon: React.ElementType;
}

const ITEMS: BottomNavItem[] = [
  { name: 'Início', route: '/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', route: '/clientes', icon: Users },
  { name: 'Planos', route: '/planos', icon: Layers },
  { name: 'Assinaturas', route: '/assinaturas', icon: Repeat },
  { name: 'Pagamentos', route: '/pagamentos', icon: Receipt },
];

export function BottomNav() {
  const { route, navigate } = useRouter();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-800/80 px-2 py-1 safe-area-bottom"
      aria-label="Navegação móvel"
    >
      <div className="flex items-center justify-around h-14">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = route === item.route;

          return (
            <button
              key={item.route}
              type="button"
              onClick={() => navigate(item.route)}
              className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-colors relative ${
                isActive ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.3]' : 'stroke-2'}`} />
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-indigo-300' : 'text-zinc-400'}`}>
                {item.name}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-6 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
