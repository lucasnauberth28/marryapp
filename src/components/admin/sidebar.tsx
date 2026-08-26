// src/components/admin/sidebar.tsx
"use client";

import { useState, useEffect } from "react";
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
  CreditCard as CreditCardIcon,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Compass,
} from "lucide-react";
import { WeddingRingsIcon } from "@/components/icons/wedding-rings";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Site dos Noivos", href: "/site-builder", icon: Sliders },
  { name: "Credenciamento", href: "/credenciamento", icon: QrCode },
  { name: "Convidados", href: "/convidados", icon: UsersIcon },
  { name: "Mesas", href: "/mesas", icon: LayoutGrid },
  { name: "Cronograma", href: "/cronograma", icon: Calendar },
  { name: "Meus Fornecedores", href: "/meus-fornecedores", icon: UsersIcon },
  { name: "Marketplace Parceiros", href: "/fornecedores", icon: Compass },
  { name: "Curadoria Parceiros", href: "/curadoria", icon: Shield },
  { name: "Mensagens", href: "/mensagens", icon: MessageSquare },
  { name: "Finanças", href: "/financas", icon: Wallet },
  { name: "Presentes", href: "/presentes-admin", icon: GiftIcon },
  { name: "Pendências", href: "/pendencias", icon: CheckSquare },
  { name: "Configurações", href: "/configuracoes", icon: SettingsIcon },
  { name: "Usuários", href: "/usuarios", icon: KeyRound },
  { name: "Perfis", href: "/perfis", icon: Shield },
];

export function Sidebar({ role = "Admin", allowedPaths = ["*"] }: { role?: string, allowedPaths?: string[] }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Carregar preferência salva no localStorage ao montar o componente
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("marryapp_sidebar_collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  // Função para alternar e salvar o estado no localStorage
  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("marryapp_sidebar_collapsed", String(next));
      return next;
    });
  };

  const filteredNavItems = allowedPaths.includes("*")
    ? navItems
    : navItems.filter((item) => allowedPaths.some(p => item.href.startsWith(p)));

  return (
    <aside 
      className={`${isCollapsed ? "w-20" : "w-64"} bg-[#FCFBF9] border-r border-stone-200/60 hidden md:flex flex-col transition-all duration-300 relative`}
    >
      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 bg-white border border-stone-200 rounded-full p-1 z-50 hover:bg-stone-50 shadow-sm transition-colors cursor-pointer"
        title={isCollapsed ? "Expandir menu" : "Recolher menu"}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4 text-stone-600" /> : <ChevronLeft className="w-4 h-4 text-stone-600" />}
      </button>

      <div className="h-16 flex items-center px-4 border-b border-stone-200/50 overflow-hidden">
        <div className="flex items-center gap-2.5 min-w-max">
          <div className="w-9 h-9 bg-gradient-to-br from-[#FAF4ED] to-[#FAF8F5] border border-[#8C6D45]/30 rounded-xl flex items-center justify-center shrink-0 shadow-xs text-[#8C6D45]">
            <WeddingRingsIcon className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-stone-800 tracking-wide font-serif italic leading-none">
                Lucas & Giovanna
              </span>
              <span className="text-[9px] text-[#8C6D45] font-extrabold uppercase tracking-widest mt-0.5">
                MarryApp
              </span>
            </div>
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
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                isActive
                  ? "bg-[#F3ECE3] text-[#8C6D45] font-semibold border-r-2 border-[#8C6D45]"
                  : "text-stone-500 hover:bg-stone-50 hover:text-stone-900 font-medium"
              } ${isCollapsed ? "justify-center" : "justify-start"}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#8C6D45]" : "text-stone-400"}`} />
              {!isCollapsed && <span className="truncate text-xs tracking-wide">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 mt-auto border-t border-stone-200/50 overflow-hidden">
        <button 
          onClick={() => logout()}
          title={isCollapsed ? "Sair" : undefined}
          className={`flex w-full items-center gap-3 px-3 py-2 rounded-lg transition-colors text-red-600 hover:bg-red-50 font-semibold text-xs tracking-wide cursor-pointer ${isCollapsed ? "justify-center" : "justify-start"}`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="truncate">Sair</span>}
        </button>
      </div>
    </aside>
  );
}
