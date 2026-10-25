"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DICA_DE_CONTAGEM_DA_PLATAFORMA,
  GRUPOS_DO_MENU_DA_PLATAFORMA,
  itemDaPlataformaEstaAtivo,
  type ChaveDeContagemDaPlataforma,
  type GrupoDoMenuDaPlataforma,
  type ItemDoMenuDaPlataforma,
} from "@/components/plataforma/nav-config";
import { IconeDaLiz } from "@/components/liz/liz-illustration";

/**
 * Lista do menu da administração.
 *   <PlatformNavList counts={counts} />                           barra lateral (padrão)
 *   <PlatformNavList variant="cards" groups={...} counts onNavigate />   aba "Mais" do celular
 * `counts` vem de getPlatformNavCounts (servidor). Item ativo: aria-current="page".
 */

export type ContagensDoMenuDaPlataformaNaPropriedade = Partial<Record<ChaveDeContagemDaPlataforma, number>>;

interface Propriedades {
  counts?: ContagensDoMenuDaPlataformaNaPropriedade;
  groups?: GrupoDoMenuDaPlataforma[];
  variant?: "sidebar" | "cards";
  onNavigate?: () => void;
}

function MarcaDeContagem({ n, kind }: { n: number; kind: ChaveDeContagemDaPlataforma }) {
  return (
    <span className="ml-auto text-xs font-semibold leading-4 text-tinta-suave">
      {n > 999 ? "999+" : n}
      <span className="sr-only"> {DICA_DE_CONTAGEM_DA_PLATAFORMA[kind]}</span>
    </span>
  );
}

const TITULO_DO_GRUPO = "px-3 pb-2 text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave";

interface PropriedadesDoItem {
  item: ItemDoMenuDaPlataforma;
  pathname: string;
  counts: ContagensDoMenuDaPlataformaNaPropriedade;
  onNavigate?: () => void;
}

/** Os dados que os dois desenhos do item usam: ícone, se está ativo e o número a mostrar. */
function leituraDoItem({ item, pathname, counts }: PropriedadesDoItem) {
  const Icon = item.brand === "liz" ? IconeDaLiz : item.icon;
  const active = itemDaPlataformaEstaAtivo(pathname, item);
  const count = item.countKey ? (counts[item.countKey] ?? 0) : 0;
  return { Icon, active, count };
}

function ItemEmCartao(props: PropriedadesDoItem) {
  const { item, onNavigate } = props;
  const { Icon, active, count } = leituraDoItem(props);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-[52px] items-center gap-3 border-b border-linha text-base last:border-b-0 ${active ? "font-semibold text-ameixa" : "text-tinta"}`}
    >
      <Icon className={`size-5 shrink-0 ${active ? "text-ameixa" : "text-tinta-suave"}`} strokeWidth={1.6} aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{item.name}</span>
      {count > 0 && item.countKey && <MarcaDeContagem n={count} kind={item.countKey} />}
    </Link>
  );
}

function ItemDaBarraLateral(props: PropriedadesDoItem) {
  const { item, onNavigate } = props;
  const { Icon, active, count } = leituraDoItem(props);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 transition-colors duration-150 ${
        item.child ? "ml-5 min-h-9 text-sm" : "min-h-10 text-[15px]"
      } ${active ? "bg-ameixa-suave font-semibold text-ameixa" : "font-medium text-tinta-suave hover:bg-areia hover:text-tinta"}`}
    >
      <Icon className={`size-5 shrink-0 ${active ? "text-ameixa" : "text-tinta-suave"}`} strokeWidth={1.6} aria-hidden="true" />
      <span className="min-w-0 flex-1 leading-5">{item.name}</span>
      {count > 0 && item.countKey && <MarcaDeContagem n={count} kind={item.countKey} />}
    </Link>
  );
}

export function ListaDoMenuDaPlataforma({ counts = {}, groups = GRUPOS_DO_MENU_DA_PLATAFORMA, variant = "sidebar", onNavigate }: Propriedades) {
  const pathname = usePathname();
  const cartoes = variant === "cards";

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group, index) =>
        cartoes ? (
          <section key={group.title ?? `grupo-${index}`} aria-label={group.title}>
            {group.title && <p className="px-1 pb-2 text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave">{group.title}</p>}
            <div className="rounded-2xl border border-linha bg-papel px-4 shadow-[var(--shadow-aceito-1)]">
              {group.items.map((item) => (
                <ItemEmCartao key={item.href} item={item} pathname={pathname} counts={counts} onNavigate={onNavigate} />
              ))}
            </div>
          </section>
        ) : (
          <div key={group.title ?? `grupo-${index}`} className="flex flex-col gap-0.5">
            {group.title && <p className={TITULO_DO_GRUPO}>{group.title}</p>}
            {group.items.map((item) => (
              <ItemDaBarraLateral key={item.href} item={item} pathname={pathname} counts={counts} onNavigate={onNavigate} />
            ))}
          </div>
        ),
      )}
    </div>
  );
}
