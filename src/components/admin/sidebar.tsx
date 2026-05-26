// src/components/admin/sidebar.tsx
"use client"; // Necessário porque vamos usar o hook usePathname

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  LayoutDashboard,
  Wallet,
  Gift,
  CheckSquare,
  Plane,
  MessageSquare
} from "lucide-react";

// Array com as rotas para facilitar a manutenção
const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Convidados", href: "/convidados", icon: Users },
  { name: "Mensagens", href: "/mensagens", icon: MessageSquare },
  { name: "Finanças", href: "/financas", icon: Wallet },
  { name: "Presentes", href: "/presentes-admin", icon: Gift },
  { name: "Pendências", href: "/pendencias", icon: CheckSquare },
  { name: "Lua de Mel", href: "/lua-de-mel", icon: Plane },
];

export function Sidebar() {
  const pathname = usePathname();

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
        {navItems.map((item) => {
          const Icon = item.icon;
          // Verifica se a rota atual é a rota do item para dar o highlight
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
    </aside>
  );
}
