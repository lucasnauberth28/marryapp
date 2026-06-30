// src/components/admin/sidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/actions/auth-actions";
import {
  Users as UsersIcon,
  LayoutDashboard,
  Wallet,
  Gift as GiftIcon,
  CheckSquare,
  Plane,
  MessageSquare,
  Settings as SettingsIcon,
  LayoutGrid,
  Shield,
  KeyRound,
  LogOut,
  QrCode,
  Calendar,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Credenciamento", href: "/credenciamento", icon: QrCode },
  { name: "Convidados", href: "/convidados", icon: UsersIcon },
  { name: "Cronograma", href: "/cronograma", icon: Calendar },
  { name: "Fornecedores", href: "/fornecedores", icon: UsersIcon },
  { name: "Despesas", href: "/despesas", icon: Wallet },
  { name: "Mesas", href: "/mesas", icon: LayoutGrid },
  { name: "Mensagens", href: "/mensagens", icon: MessageSquare },
  { name: "Finanças", href: "/financas", icon: Wallet },
  { name: "Presentes", href: "/presentes-admin", icon: GiftIcon },
  { name: "Pendências", href: "/pendencias", icon: CheckSquare },
  { name: "Lua de Mel", href: "/lua-de-mel", icon: Plane },
  { name: "Configurações", href: "/configuracoes", icon: SettingsIcon },
  { name: "Usuários", href: "/usuarios", icon: KeyRound },
  { name: "Perfis", href: "/perfis", icon: Shield },
];

export function Sidebar({ role = "Admin", allowedPaths = ["*"] }: { role?: string, allowedPaths?: string[] }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filteredNavItems = allowedPaths.includes("*")
    ? navItems
    : navItems.filter((item) => allowedPaths.some(p => item.href.startsWith(p)));

  return (
    <aside 
      className={`${isCollapsed ? "w-20" : "w-64"} bg-white border-r border-zinc-200 hidden md:flex flex-col transition-all duration-300 relative`}
    >
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-white border border-zinc-200 rounded-full p-1 z-50 hover:bg-zinc-50 shadow-sm"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4 text-zinc-600" /> : <ChevronLeft className="w-4 h-4 text-zinc-600" />}
      </button>

      <div className="h-16 flex items-center px-4 border-b border-zinc-200 overflow-hidden">
        <div className="flex items-center gap-2 min-w-max">
          <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm leading-none">L&G</span>
          </div>
          {!isCollapsed && (
            <h1 className="font-bold text-lg text-zinc-900 tracking-tight transition-opacity duration-300">
              Lucas & Giovanna
            </h1>
          )}
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
                isActive
                  ? "bg-zinc-100 text-zinc-900 font-semibold"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 font-medium"
              } ${isCollapsed ? "justify-center" : "justify-start"}`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-zinc-900" : "text-zinc-400"}`} />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 mt-auto border-t border-zinc-200 overflow-hidden">
        <button 
          onClick={() => logout()}
          title={isCollapsed ? "Sair" : undefined}
          className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-red-600 hover:bg-red-50 font-medium ${isCollapsed ? "justify-center" : "justify-start"}`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="truncate">Sair</span>}
        </button>
      </div>
    </aside>
  );
}
