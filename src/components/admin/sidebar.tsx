// src/components/admin/sidebar.tsx
"use client"; // Necessário porque vamos usar o hook usePathname

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  LogOut
} from "lucide-react";

// Array com as rotas para facilitar a manutenção
const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Convidados", href: "/convidados", icon: UsersIcon },
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
import { logout } from "@/actions/auth-actions";

export function Sidebar({ role = "Admin", allowedPaths = ["*"] }: { role?: string, allowedPaths?: string[] }) {
  const pathname = usePathname();

  const filteredNavItems = allowedPaths.includes("*")
    ? navItems
    : navItems.filter((item) => allowedPaths.some(p => item.href.startsWith(p)));

  return (
    <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm leading-none">L&G</span>
          </div>
          <h1 className="font-bold text-xl text-zinc-900 tracking-tight">
            Lucas & Giovanna
          </h1>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                isActive
                  ? "bg-zinc-100 text-zinc-900 font-semibold"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 font-medium"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${isActive ? "text-zinc-900" : "text-zinc-400"}`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 mt-auto border-t border-zinc-200">
        <button 
          onClick={() => logout()}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-red-600 hover:bg-red-50 font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
