// src/components/admin/sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { logout } from "@/actions/auth-actions";
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { NavList } from "@/components/admin/nav-list";
import { Logo } from "@/components/brand/logo";

const COLLAPSED_KEY = "aceito_sidebar_collapsed";

interface SidebarProps {
  allowedPaths?: string[];
  coupleNames: string;
  dateLabel?: string | null;
}

export function Sidebar({ allowedPaths = [], coupleNames, dateLabel }: SidebarProps) {
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
      className={`${isCollapsed ? "w-20" : "w-[264px]"} sticky top-0 hidden h-screen shrink-0 flex-col border-r border-linha bg-linho transition-[width] duration-300 ease-[var(--ease-aceito)] md:flex`}
    >
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-7 z-50 grid h-6 w-6 cursor-pointer place-items-center rounded-full border border-linha bg-papel text-tinta-suave shadow-[var(--shadow-aceito-1)] transition-colors hover:text-ameixa"
        aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
        title={isCollapsed ? "Expandir menu" : "Recolher menu"}
      >
        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      <div className={`flex items-center gap-2.5 px-5 pb-4 pt-6 ${isCollapsed ? "justify-center px-3" : ""}`}>
        <Link href="/dashboard" aria-label="Aceito, início do painel" className="flex items-center gap-2.5">
          <Logo variant="mark" height={30} priority />
          {!isCollapsed && <Logo variant="wordmark" height={20} />}
        </Link>
      </div>

      {!isCollapsed && (
        <div className="mx-4 mb-4 rounded-2xl border border-linha bg-papel px-4 py-3">
          <p className="truncate font-display text-lg leading-tight text-tinta">{coupleNames}</p>
          {dateLabel && <p className="mt-0.5 text-sm text-tinta-suave">{dateLabel}</p>}
        </div>
      )}

      <nav aria-label="Menu principal" className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4" data-lenis-prevent>
        <NavList allowedPaths={allowedPaths} collapsed={isCollapsed} />
      </nav>

      <div className="mt-auto border-t border-linha p-3">
        <button
          onClick={() => logout()}
          title={isCollapsed ? "Sair" : undefined}
          aria-label="Sair"
          className={`flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-[15px] font-semibold text-perigo transition-colors hover:bg-perigo-suave ${isCollapsed ? "justify-center" : "justify-start"}`}
        >
          <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          {!isCollapsed && <span className="truncate">Sair</span>}
        </button>
      </div>
    </aside>
  );
}
