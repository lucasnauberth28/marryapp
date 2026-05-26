"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Bell, 
  Menu, 
  X, 
  LayoutDashboard, 
  Users, 
  Wallet, 
  Gift, 
  CheckSquare, 
  Plane,
  Heart,
  MessageSquare
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

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Convidados", href: "/convidados", icon: Users },
  { name: "Mensagens", href: "/mensagens", icon: MessageSquare },
  { name: "Finanças", href: "/financas", icon: Wallet },
  { name: "Presentes", href: "/presentes-admin", icon: Gift },
  { name: "Pendências", href: "/pendencias", icon: CheckSquare },
  { name: "Lua de Mel", href: "/lua-de-mel", icon: Plane },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 md:px-8 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          {/* Menu Mobile Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-zinc-600 w-10 h-10"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu className="w-8 h-8" />
          </Button>

          <div>
            <p className="text-sm font-bold text-zinc-900 md:hidden flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
              L&G
            </p>
            <p className="text-sm font-medium text-zinc-500 hidden md:block">
              Casamento Lucas & Giovanna
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-zinc-500 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/01.png" alt="@noivos" />
                  <AvatarFallback className="bg-zinc-900 text-white text-xs">L&G</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Lucas & Giovanna</p>
                  <p className="text-xs leading-none text-zinc-500">
                    lucas.giovanna@casamento.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Configurações</DropdownMenuItem>
              <DropdownMenuItem>Suporte</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 focus:text-red-600">
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
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Sidebar Drawer */}
          <div className="absolute top-0 left-0 bottom-0 w-[90%] bg-white shadow-2xl flex flex-col p-6 animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm leading-none">L&G</span>
                </div>
                <h2 className="font-bold text-lg text-zinc-900 tracking-tight">
                  Lucas & Giovanna
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(false)}
                className="text-zinc-500"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <nav className="flex-1 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? "bg-zinc-100 text-zinc-900 font-bold shadow-sm"
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

            <div className="pt-6 border-t border-zinc-100 text-center text-xs text-zinc-400">
              Casamento Lucas & Giovanna © 2026
            </div>
          </div>
        </div>
      )}
    </>
  );
}