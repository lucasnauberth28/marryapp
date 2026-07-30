"use client";

import { useState, useEffect, useTransition } from "react";
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
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  MessageCircle,
  RefreshCw,
  CreditCard as CreditCardIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { getSystemNotifications, SystemNotification } from "@/actions/notification-actions";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Credenciamento", href: "/credenciamento", icon: QrCode },
  { name: "Convidados", href: "/convidados", icon: UsersIcon },
  { name: "Mesas", href: "/mesas", icon: LayoutGrid },
  { name: "Cronograma", href: "/cronograma", icon: Calendar },
  { name: "Fornecedores", href: "/fornecedores", icon: UsersIcon },
  { name: "Mensagens", href: "/mensagens", icon: MessageSquare },
  { name: "Finanças", href: "/financas", icon: Wallet },
  { name: "Presentes", href: "/presentes-admin", icon: GiftIcon },
  { name: "Pendências", href: "/pendencias", icon: CheckSquare },
  { name: "Configurações", href: "/configuracoes", icon: SettingsIcon },
  { name: "Usuários", href: "/usuarios", icon: KeyRound },
  { name: "Perfis", href: "/perfis", icon: Shield },
];

export function Header({ role = "Admin", allowedPaths = ["*"] }: { role?: string, allowedPaths?: string[] }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  const loadNotifications = () => {
    startTransition(async () => {
      const res = await getSystemNotifications();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    });
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const filteredNavItems = allowedPaths.includes("*")
    ? navItems
    : navItems.filter((item) => allowedPaths.some(p => item.href.startsWith(p)));

  const handleMarkAllRead = () => {
    setUnreadCount(0);
  };

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
          {/* Dropdown da Central de Notificações */}
          <DropdownMenu onOpenChange={(open) => open && loadNotifications()}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-stone-500 relative hover:text-[#8C6D45] transition-colors cursor-pointer">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-red-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 sm:w-96 p-0 overflow-hidden shadow-2xl rounded-2xl border-stone-200 font-sans" align="end">
              <div className="p-4 bg-[#FAF8F5] border-b border-stone-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#8C6D45]" />
                  <h3 className="font-bold text-sm text-stone-800">Notificações do Sistema</h3>
                  {unreadCount > 0 && (
                    <Badge className="bg-[#8C6D45] text-white text-[10px] h-5 px-1.5">
                      {unreadCount} novas
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-stone-400 hover:text-stone-600"
                    onClick={loadNotifications}
                    title="Atualizar notificações"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
                  </Button>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-semibold text-[#8C6D45] hover:underline px-1 cursor-pointer"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
                {notifications.length === 0 ? (
                  <div className="py-8 px-4 text-center text-stone-400 text-xs flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500/60" />
                    <span>Nenhum alerta pendente. Tudo em dia!</span>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <Link
                      key={n.id}
                      href={n.linkHref}
                      className="p-3.5 flex items-start gap-3 hover:bg-stone-50 transition-colors block group cursor-pointer"
                    >
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        n.type === "alert"
                          ? "bg-red-50 text-red-600 border border-red-200/60"
                          : n.type === "warning"
                          ? "bg-amber-50 text-amber-600 border border-amber-200/60"
                          : "bg-blue-50 text-blue-600 border border-blue-200/60"
                      }`}>
                        {n.category === "finance" && <Wallet className="w-4 h-4" />}
                        {n.category === "expense" && <Calendar className="w-4 h-4" />}
                        {n.category === "guest" && <UsersIcon className="w-4 h-4" />}
                        {n.category === "whatsapp" && <MessageCircle className="w-4 h-4" />}
                      </div>

                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-xs text-stone-900 group-hover:text-[#8C6D45] transition-colors truncate">
                            {n.title}
                          </h4>
                          <ArrowRight className="w-3 h-3 text-stone-300 group-hover:text-[#8C6D45] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                        </div>
                        <p className="text-[11px] text-stone-500 leading-snug line-clamp-2">
                          {n.description}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-stone-50 border-t border-stone-200/60 text-center">
                <Link
                  href="/mensagens"
                  className="text-xs font-semibold text-[#8C6D45] hover:underline inline-flex items-center gap-1"
                >
                  Ir para Central de Mensagens <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Menu de Usuário Repaginado & Módulo Carteira */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 ring-2 ring-stone-200 hover:ring-[#8C6D45] transition-all cursor-pointer">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/avatars/01.png" alt="@noivos" />
                  <AvatarFallback className="bg-gradient-to-br from-[#C5A880] to-[#A3855E] text-white text-xs font-bold">L&G</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 sm:w-84 p-0 overflow-hidden shadow-2xl rounded-3xl border-stone-200 bg-white font-sans animate-in fade-in zoom-in-95 duration-200" align="end" forceMount>
              {/* Header do Usuário */}
              <div className="p-4 bg-gradient-to-br from-[#FAF7F2] to-[#F3ECE3] border-b border-stone-200/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 ring-2 ring-white shadow-sm">
                    <AvatarImage src="/avatars/01.png" alt="@noivos" />
                    <AvatarFallback className="bg-[#8C6D45] text-white font-bold text-xs">L&G</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-sm text-stone-900 font-serif italic">Lucas & Giovanna</h4>
                    <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider bg-[#8C6D45] text-white px-2 py-0.5 rounded-full mt-0.5">
                      {role}
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD DE DESTAQUE: MÓDULO CARTEIRA */}
              <div className="p-3">
                <Link
                  href="/carteira"
                  className="block p-4 bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 text-white rounded-2xl shadow-md border border-stone-800 hover:border-[#8C6D45]/50 transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-[#8C6D45] rounded-lg flex items-center justify-center text-white shadow-xs">
                        <CreditCardIcon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs text-stone-200">Módulo Carteira</span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                      Exclusivo
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-400 leading-snug">
                    Gerencie cartões de crédito, saldos e movimentações financeiras.
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-stone-800/80 flex items-center justify-between text-xs font-bold text-[#C5A880] group-hover:text-white transition-colors">
                    <span>Acessar Minha Carteira</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </div>

              <DropdownMenuSeparator className="bg-stone-100 my-1" />

              {/* Itens do Menu de Usuário */}
              <div className="p-1 space-y-0.5">
                {(allowedPaths.includes("*") || allowedPaths.includes("/configuracoes")) && (
                  <>
                    <DropdownMenuItem
                      onClick={() => (window.location.href = "/configuracoes")}
                      className="px-3 py-2.5 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer flex items-center gap-2.5"
                    >
                      <SettingsIcon className="w-4 h-4 text-stone-400" />
                      <span>Configurações Gerais</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => (window.location.href = "/usuarios")}
                      className="px-3 py-2.5 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer flex items-center gap-2.5"
                    >
                      <KeyRound className="w-4 h-4 text-stone-400" />
                      <span>Gerenciar Usuários</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => (window.location.href = "/perfis")}
                      className="px-3 py-2.5 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer flex items-center gap-2.5"
                    >
                      <Shield className="w-4 h-4 text-stone-400" />
                      <span>Perfis e Acessos (Roles)</span>
                    </DropdownMenuItem>
                  </>
                )}
              </div>

              <DropdownMenuSeparator className="bg-stone-100 my-1" />

              {/* Botão de Logout */}
              <div className="p-1.5 bg-stone-50/50">
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer flex items-center gap-2.5"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Sair da Conta</span>
                </DropdownMenuItem>
              </div>
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