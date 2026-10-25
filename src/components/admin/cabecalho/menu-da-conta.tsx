"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Settings as SettingsIcon, LogOut, CreditCard as CreditCardIcon, UserRound, LayoutDashboard, ChevronDown, type LucideIcon } from "lucide-react";
import {
  MenuSuspenso,
  ConteudoDoMenuSuspenso,
  ItemDoMenuSuspenso,
  RotuloDoMenuSuspenso,
  SeparadorDoMenuSuspenso,
  GatilhoDoMenuSuspenso,
} from "@/components/ui/dropdown-menu";
import { sair } from "@/actions/auth-actions";
import { IndicadorDeCarregamento } from "@/components/ui/spinner";
import { temAcessoAoCaminho } from "@/lib/permissions";
import { ItemDeMenuDoTour } from "@/components/tour/tour-restart";
import { ItensDeMenuDoTema } from "@/components/theme/theme-toggle";
import { itensVisiveisDoAdmin } from "@/components/admin/nav-config";

const classeDoItemDoMenu = "cursor-pointer rounded-[8px] px-3 py-2.5 text-sm text-tinta";

function ItemComLink({ href, icon: Icon, className = classeDoItemDoMenu, children }: { href: string; icon: LucideIcon; className?: string; children: React.ReactNode }) {
  return (
    <ItemDoMenuSuspenso asChild className={className}>
      <Link href={href} className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-tinta-suave" /> {children}
      </Link>
    </ItemDoMenuSuspenso>
  );
}

function ItemSair() {
  const [leaving, startLeave] = useTransition();
  return (
    <ItemDoMenuSuspenso
      disabled={leaving}
      aria-busy={leaving || undefined}
      // Fica aberto até a saída terminar, mostrando o andamento
      onSelect={(e) => {
        e.preventDefault();
        startLeave(() => sair());
      }}
      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-perigo focus:bg-perigo-suave focus:text-perigo"
    >
      {leaving ? <IndicadorDeCarregamento /> : <LogOut className="h-4 w-4" />} Sair
    </ItemDoMenuSuspenso>
  );
}

/** No celular as ferramentas de administração ficam aqui; no computador, na barra lateral. */
function FerramentasDeAdministracao({ allowedPaths }: { allowedPaths: string[] }) {
  const adminItems = itensVisiveisDoAdmin(allowedPaths);
  if (adminItems.length === 0) return null;
  return (
    <div className="md:hidden">
      <SeparadorDoMenuSuspenso className="my-0 bg-linha" />
      <div className="space-y-0.5 p-1.5">
        <RotuloDoMenuSuspenso className="text-xs font-medium text-tinta-suave">Gestão da plataforma</RotuloDoMenuSuspenso>
        {adminItems.map((item) => (
          <ItemComLink key={item.href} href={item.href} icon={item.icon}>
            {item.name}
          </ItemComLink>
        ))}
      </div>
    </div>
  );
}

interface Propriedades {
  allowedPaths: string[];
  isPlatformAdmin: boolean;
  planName: string | null;
  label: { initials: string; menuTitle: string; menuSubtitle: string };
}

function BotaoDoMenuDaConta({ initials }: { initials: string }) {
  return (
    <GatilhoDoMenuSuspenso asChild>
      <button
        className="flex h-11 cursor-pointer items-center gap-1 rounded-full pl-1 pr-1 text-tinta-suave md:pr-1.5 transition-colors hover:bg-areia/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ameixa data-[state=open]:bg-areia/70"
        aria-label="Menu da conta"
        data-tour="conta"
      >
        <span className="grid size-9 place-items-center rounded-full bg-ameixa-suave text-xs font-semibold tracking-[0.02em] text-ameixa" aria-hidden="true">
          {initials}
        </span>
        <ChevronDown className="hidden size-4 md:block" aria-hidden="true" />
      </button>
    </GatilhoDoMenuSuspenso>
  );
}

/** O menu da conta (as iniciais no cabeçalho): configurações, plano, conta, tour, administração, tema e sair. */
export function MenuDaConta({ allowedPaths, isPlatformAdmin, planName, label }: Propriedades) {
  const can = (path: string) => temAcessoAoCaminho(allowedPaths, path);

  return (
    <MenuSuspenso>
      <BotaoDoMenuDaConta initials={label.initials} />
      <ConteudoDoMenuSuspenso className="w-72 overflow-hidden rounded-[12px] border-linha bg-papel p-0 shadow-[var(--shadow-aceito-2)]" align="end">
        <div className="border-b border-linha px-4 py-3">
          <p className="truncate font-display text-base font-semibold text-tinta">{label.menuTitle}</p>
          <p className="text-sm text-tinta-suave">{label.menuSubtitle}</p>
        </div>
        <div className="space-y-0.5 p-1.5">
          {can("/configuracoes") && <ItemComLink href="/configuracoes" icon={SettingsIcon}>Configurações</ItemComLink>}
          {can("/plano") && (
            <ItemComLink href="/plano" icon={CreditCardIcon}>
              Plano e pagamentos
              {planName && <span className="ml-auto text-xs text-tinta-suave">{planName}</span>}
            </ItemComLink>
          )}
          <ItemComLink href="/conta" icon={UserRound}>Minha conta</ItemComLink>
          <ItemDeMenuDoTour />
          {isPlatformAdmin && (
            <ItemComLink href="/admin" icon={LayoutDashboard} className={`${classeDoItemDoMenu} md:hidden`}>
              Administração
            </ItemComLink>
          )}
        </div>
        <FerramentasDeAdministracao allowedPaths={allowedPaths} />
        {/* No computador o seletor fica no botão sol/lua do cabeçalho */}
        <SeparadorDoMenuSuspenso className="my-0 bg-linha md:hidden" />
        <div className="p-1.5 md:hidden">
          <ItensDeMenuDoTema />
        </div>
        <SeparadorDoMenuSuspenso className="my-0 bg-linha" />
        <div className="p-1.5">
          <ItemSair />
        </div>
      </ConteudoDoMenuSuspenso>
    </MenuSuspenso>
  );
}
