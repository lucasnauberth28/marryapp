// src/components/admin/sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import { logout } from "@/actions/auth-actions";
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { WeddingRingsIcon } from "@/components/icons/wedding-rings";
import { NavList } from "@/components/admin/nav-list";

const COLLAPSED_KEY = "marryapp_sidebar_collapsed";

interface SidebarProps {
  allowedPaths?: string[];
  coupleNames: string;
}

export function Sidebar({ allowedPaths = [], coupleNames }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Preferência de menu recolhido salva no navegador
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- leitura única do localStorage após montar
      setIsCollapsed(localStorage.getItem(COLLAPSED_KEY) === "true");
    } catch {
      // localStorage indisponível (modo privado): mantém expandido
    }
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_KEY, String(next));
      } catch {
        // ignora
      }
      return next;
    });
  };

  return (
    <aside
      className={`${isCollapsed ? "w-20" : "w-64"} relative hidden flex-col border-r border-stone-200/60 bg-paper transition-all duration-300 md:flex`}
    >
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 z-50 cursor-pointer rounded-full border border-stone-200 bg-white p-1 shadow-sm transition-colors hover:bg-stone-50"
        aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
        title={isCollapsed ? "Expandir menu" : "Recolher menu"}
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4 text-stone-600" /> : <ChevronLeft className="h-4 w-4 text-stone-600" />}
      </button>

      <div className="flex h-16 items-center overflow-hidden border-b border-stone-200/50 px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand/30 bg-gradient-to-br from-brand-50 to-ivory text-brand shadow-xs">
            <WeddingRingsIcon className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-serif text-base font-semibold italic leading-tight text-stone-800">
                {coupleNames}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">MarryApp</span>
            </div>
          )}
        </div>
      </div>

      <nav aria-label="Menu principal" className="flex-1 overflow-y-auto overflow-x-hidden p-3 scrollbar-hide">
        <NavList allowedPaths={allowedPaths} collapsed={isCollapsed} />
      </nav>

      <div className="mt-auto overflow-hidden border-t border-stone-200/50 p-3">
        <button
          onClick={() => logout()}
          title={isCollapsed ? "Sair" : undefined}
          aria-label="Sair"
          className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 ${isCollapsed ? "justify-center" : "justify-start"}`}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          {!isCollapsed && <span className="truncate">Sair</span>}
        </button>
      </div>
    </aside>
  );
}
