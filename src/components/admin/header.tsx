"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Bell, 
  Menu, 
  X, 
  LayoutDashboard, 
  Users as UsersIcon, 
  Wallet, 
  Gift as GiftIcon, 
  CheckSquare, 
  Plane,
  Heart,
  MessageSquare,
  LayoutGrid,
  Settings as SettingsIcon,
  Shield, 
  KeyRound, 
  LogOut,
  QrCode,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { logout } from "@/actions/auth-actions";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Credenciamento", href: "/credenciamento", icon: QrCode },
  { name: "Convidados", href: "/convidados", icon: UsersIcon },
  { name: "Cronograma", href: "/cronograma", icon: Calendar },
  { name: "Mesas", href: "/mesas", icon: LayoutGrid },
  { name: "Finanças", href: "/financas", icon: Wallet },
  { name: "Presentes", href: "/presentes-admin", icon: GiftIcon },
  { name: "Pendências", href: "/pendencias", icon: CheckSquare },
  { name: "Mensagens", href: "/mensagens", icon: MessageSquare },
  { name: "Lua de Mel", href: "/lua-de-mel", icon: Plane },
  { name: "Configurações", href: "/configuracoes", icon: SettingsIcon },
  { name: "Usuários", href: "/usuarios", icon: KeyRound },
  { name: "Perfis", href: "/perfis", icon: Shield },
];

export function Header({ role = "Admin", allowedPaths = ["*"] }: { role?: string, allowedPaths?: string[] }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const filteredNavItems = allowedPaths.includes("*")
    ? navItems
    : navItems.filter((item) => allowedPaths.some(p => item.href.startsWith(p)));

  return (
    <>
      <header className="h-16 bg-[#FCFBF9]/80 backdrop-blur border-b border-stone-200/50 flex items-center justify-between px-6 md:px-8 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          {/* Menu Mobile Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-stone-600 w-10 h-10"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu className="w-8 h-8" />
          </Button>

          <div>
            <p className="text-sm font-bold text-stone-850 md:hidden flex items-center gap-2 font-serif italic">
              <Heart className="w-3.5 h-3.5 text-[#C5A880] fill-[#C5A880]" />
              L&G
            </p>
            <p className="text-xs font-semibold text-stone-400 tracking-wider uppercase hidden md:block">
              Casamento Lucas & Giovanna — Gestão Comercial
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-stone-400 relative hover:text-[#8C6D45]">
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-[#8C6D45] rounded-full"></span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/01.png" alt="@noivos" />
                  <AvatarFallback className="bg-gradient-to-br from-[#C5A880] to-[#A3855E] text-white text-xs">L&G</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Lucas & Giovanna
                  </p>
                  <p className="text-xs leading-none text-zinc-500">
                    {role}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(allowedPaths.includes("*") || allowedPaths.includes("/configuracoes")) && (
                <>
                  <DropdownMenuItem onClick={() => window.location.href = "/perfis"}>Perfis (Roles)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = "/usuarios"}>Usuários</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = "/configuracoes"}>Configurações Gerais</DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem>Suporte</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="text-red-600 focus:text-red-600">
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Sliding Mobile Menu Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-[#4A3E3D]/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Sidebar Drawer */}
          <div className="absolute top-0 left-0 bottom-0 w-[260px] bg-[#FCFBF9] shadow-2xl flex flex-col p-6 animate-in slide-in-from-left duration-300 border-r border-stone-200/50">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-200/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#C5A880] to-[#A3855E] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs leading-none">L&G</span>
                </div>
                <h2 className="font-semibold text-base text-stone-800 font-serif italic">
                  Lucas & Giovanna
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(false)}
                className="text-stone-500 w-8 h-8 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                      isActive
                        ? "bg-[#F3ECE3] text-[#8C6D45] font-semibold border-r-2 border-[#8C6D45]"
                        : "text-stone-500 hover:bg-stone-50 hover:text-stone-900 font-medium"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#8C6D45]" : "text-stone-400"}`} />
                    <span className="text-xs tracking-wide">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            
            <div className="p-4 border-t border-stone-200/50 mt-auto">
              <button 
                onClick={() => {
                  setIsMenuOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-3 px-3 py-2 rounded-lg transition-colors text-red-650 font-semibold text-xs tracking-wide hover:bg-red-50 cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}