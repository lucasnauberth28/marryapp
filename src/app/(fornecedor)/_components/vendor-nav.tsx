"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays, CreditCard, ExternalLink, Inbox, LogOut, Star, Store, UserRound, type LucideIcon } from "lucide-react";
import { useFormStatus } from "react-dom";
import { sair } from "@/actions/auth-actions";
import { IndicadorDeCarregamento } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { LINK_DO_PLANO } from "../_lib/vendor-panel";

const CAMINHO_DO_PAINEL = "/fornecedor";
const CAMINHO_DOS_PEDIDOS = "/fornecedor/pedidos";
const CAMINHO_DA_AGENDA = "/fornecedor/agenda";
const CAMINHO_DO_PERFIL = "/fornecedor/perfil";
const CAMINHO_DAS_AVALIACOES = "/fornecedor/avaliacoes";
const CAMINHO_DAS_NOTIFICACOES = "/fornecedor/notificacoes";

function estaAtivo(pathname: string, href: string) {
  // A lista de pedidos fica em /fornecedor; o detalhe, em /fornecedor/pedidos/[id].
  if (href === CAMINHO_DO_PAINEL) return pathname === CAMINHO_DO_PAINEL || pathname === CAMINHO_DOS_PEDIDOS || pathname.startsWith(`${CAMINHO_DOS_PEDIDOS}/`);
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface ItemLateral {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: number;
  external?: boolean;
}

/** Navegação lateral (desktop). */
export function MenuLateralDoFornecedor({ newLeads, publicProfileHref }: { newLeads: number; publicProfileHref: string | null }) {
  const pathname = usePathname();

  const items: ItemLateral[] = [
    { href: CAMINHO_DO_PAINEL, label: "Pedidos de orçamento", icon: Inbox, count: newLeads },
    { href: CAMINHO_DA_AGENDA, label: "Agenda", icon: CalendarDays },
    { href: CAMINHO_DO_PERFIL, label: "Meu perfil", icon: Store },
    { href: CAMINHO_DAS_AVALIACOES, label: "Avaliações", icon: Star },
    { href: LINK_DO_PLANO, label: "Plano", icon: CreditCard },
    { href: CAMINHO_DAS_NOTIFICACOES, label: "Avisos", icon: Bell },
    { href: "/conta", label: "Minha conta", icon: UserRound },
  ];
  if (publicProfileHref) {
    items.push({ href: publicProfileHref, label: "Ver perfil público", icon: ExternalLink, external: true });
  }

  return (
    <nav aria-label="Painel do fornecedor">
      <ul className="flex flex-col gap-1">
        {items.map(({ href, label, icon: Icon, count, external }) => {
          const active = !external && estaAtivo(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors",
                  active ? "bg-ameixa-suave font-semibold text-ameixa" : "text-tinta-suave hover:bg-areia hover:text-tinta",
                )}
              >
                <Icon aria-hidden="true" className="size-[18px] shrink-0" />
                <span className="flex-1">{label}</span>
                {count ? (
                  <span className="min-w-6 rounded-full bg-ameixa px-1.5 py-0.5 text-center text-xs font-semibold text-on-ameixa">
                    {count}
                    <span className="sr-only"> sem resposta</span>
                  </span>
                ) : null}
                {external ? <span className="sr-only">(abre em nova aba)</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Ícone do "Sair": vira spinner enquanto a saída roda (o botão fica desabilitado, sem mudar de tamanho). */
function IconeDeSair({ className }: { className: string }) {
  const { pending } = useFormStatus();
  return pending ? <IndicadorDeCarregamento className={className} /> : <LogOut aria-hidden="true" className={className} />;
}

function EnvioDeSair({ className, children, ...props }: React.ComponentProps<"button">) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending || undefined} className={cn("disabled:pointer-events-none", className)} {...props}>
      {children}
    </button>
  );
}

export function BotaoDeSair({ className }: { className?: string }) {
  return (
    <form action={sair}>
      <EnvioDeSair
        className={cn(
          "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-tinta-suave transition-colors hover:bg-areia hover:text-tinta",
          className,
        )}
      >
        <IconeDeSair className="size-[18px] shrink-0" />
        Sair
      </EnvioDeSair>
    </form>
  );
}

/** Botão "Sair" só com ícone, para o topo no celular. */
export function BotaoDeIconeDeSair() {
  return (
    <form action={sair} className="shrink-0">
      <EnvioDeSair
        aria-label="Sair"
        title="Sair"
        className="grid size-11 place-items-center rounded-xl text-tinta-suave transition-colors hover:bg-areia hover:text-tinta"
      >
        <IconeDeSair className="size-5" />
      </EnvioDeSair>
    </form>
  );
}

const TITULOS_NO_CELULAR: { href: string; title: string }[] = [
  { href: CAMINHO_DOS_PEDIDOS, title: "Pedido" },
  { href: CAMINHO_DA_AGENDA, title: "Agenda" },
  { href: CAMINHO_DO_PERFIL, title: "Meu perfil" },
  { href: CAMINHO_DAS_AVALIACOES, title: "Avaliações" },
  { href: LINK_DO_PLANO, title: "Plano" },
  { href: CAMINHO_DAS_NOTIFICACOES, title: "Avisos" },
];

/** Título do topo no celular, conforme a página. */
export function TituloMovelDoFornecedor() {
  const pathname = usePathname();
  const match = TITULOS_NO_CELULAR.find(({ href }) => pathname === href || pathname.startsWith(`${href}/`));
  return <p className="min-w-0 flex-1 truncate text-lg font-semibold">{match?.title ?? "Pedidos"}</p>;
}

/** Barra de abas inferior (celular): 80px incluindo a área segura. */
export function BarraDeAbasDoFornecedor() {
  const pathname = usePathname();
  const tabs = [
    { href: CAMINHO_DO_PAINEL, label: "Pedidos", icon: Inbox },
    { href: CAMINHO_DA_AGENDA, label: "Agenda", icon: CalendarDays },
    { href: CAMINHO_DO_PERFIL, label: "Perfil", icon: Store },
    { href: LINK_DO_PLANO, label: "Plano", icon: CreditCard },
  ];

  return (
    <nav
      aria-label="Painel do fornecedor"
      className="fixed inset-x-0 bottom-0 z-40 grid h-20 grid-cols-4 border-t border-linha bg-papel pb-[max(16px,env(safe-area-inset-bottom))] md:hidden"
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = estaAtivo(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors",
              active ? "text-salvia" : "text-tinta-suave hover:text-tinta",
            )}
          >
            <span className={cn("grid place-items-center rounded-full px-3.5 py-0.5", active && "bg-salvia-suave")}>
              <Icon aria-hidden="true" className="size-5" />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
