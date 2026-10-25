// "O que fazer agora": até 3 itens; o primeiro é a sugestão da Liz.
import Link from "next/link";
import { Armchair, CalendarHeart, Clock, Gift, ListChecks, Receipt, type LucideIcon } from "lucide-react";
import { AvatarDaLiz, IlustracaoDaLiz } from "@/components/liz/liz-illustration";
import type { ItemDaFila, TipoDeItemDaFila } from "@/lib/dashboard-summary";
import { BlocoDoPainel, Etiqueta, LinkDeTexto, estiloDoBotaoPrimario, estiloDoBotaoSecundario } from "../ui";

const estiloDoBotaoDeTexto = "inline-flex min-h-11 items-center rounded-[8px] px-1 text-sm font-semibold text-ameixa underline-offset-4 hover:underline";

const ICONE_POR_TIPO: Record<Exclude<TipoDeItemDaFila, "liz">, LucideIcon> = { pix: Gift, despesa: Receipt, data: CalendarHeart, tarefa: ListChecks, mesas: Armchair };

type PrazoDaFila = { chip: string; remindHref: string } | null;

/** Ação de um item: link interno ou âncora da própria página. */
function LinkDoItem({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  return href.startsWith("#") ? (
    <a href={href} className={className}>
      {children}
    </a>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function FilaVazia() {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
      <IlustracaoDaLiz pose="tranquila" height={88} decorative className="h-[88px] w-auto" />
      <div className="grid gap-1">
        <p className="text-[14.5px] font-semibold text-tinta">Nada pedindo atenção agora</p>
        <p className="text-[14.5px] leading-[1.45] text-tinta-suave">Quando surgir algo, como um convite sem resposta ou um Pix para conferir, aparece aqui.</p>
      </div>
    </div>
  );
}

function IconeDoItem({ item }: { item: ItemDaFila }) {
  if (item.kind === "liz") return <AvatarDaLiz size={40} decorative />;
  const Icon = ICONE_POR_TIPO[item.kind];
  return (
    <span className={`grid size-10 place-items-center rounded-full ${item.kind === "pix" || item.kind === "despesa" ? "bg-aviso-suave text-aviso" : "bg-areia text-tinta-suave"}`}>
      <Icon className="size-[19px]" strokeWidth={1.6} aria-hidden="true" />
    </span>
  );
}

function AcoesDoItem({ item, prazo }: { item: ItemDaFila; prazo: PrazoDaFila }) {
  const prazoUrgente = item.kind === "liz" && prazo && item.id === "rsvp-sem-resposta" ? prazo : null;
  if (!item.action && !prazoUrgente) return null;
  return (
    <div className="col-start-2 flex flex-wrap items-center gap-2">
      {prazoUrgente && (
        <>
          <Etiqueta tone="aviso" icon={Clock}>
            {prazoUrgente.chip}
          </Etiqueta>
          <LinkDoItem href={prazoUrgente.remindHref} className={estiloDoBotaoPrimario}>
            Lembrar quem não respondeu
          </LinkDoItem>
        </>
      )}
      {item.action &&
        (item.kind !== "liz" ? (
          <LinkDeTexto href={item.action.href}>{item.action.label}</LinkDeTexto>
        ) : (
          <LinkDoItem href={item.action.href} className={prazoUrgente ? estiloDoBotaoDeTexto : estiloDoBotaoSecundario}>
            {item.action.label}
          </LinkDoItem>
        ))}
    </div>
  );
}

function LinhaDaFila({ item, prazo }: { item: ItemDaFila; prazo: PrazoDaFila }) {
  return (
    <li className="grid grid-cols-[40px_minmax(0,1fr)] gap-x-3.5 gap-y-1 border-t border-linha py-3.5 first:border-t-0 first:pt-0 last:pb-0">
      <IconeDoItem item={item} />
      <div className="grid min-h-10 content-center gap-0.5">
        {item.kind === "liz" && <strong className="text-[13px] font-semibold text-ameixa">A Liz sugere o próximo passo</strong>}
        <p className="text-pretty text-[14.5px] leading-[1.45] text-tinta">{item.text}</p>
      </div>
      <AcoesDoItem item={item} prazo={prazo} />
    </li>
  );
}

interface PropriedadesDaFila {
  items: ItemDaFila[];
  /** Prazo de confirmação chegando: o primeiro item ganha o chip e o botão de lembrar quem não respondeu. */
  deadline: PrazoDaFila;
  className?: string;
}

export function BlocoDaFila({ items, deadline, className = "" }: PropriedadesDaFila) {
  return (
    <BlocoDoPainel id="agora" title="O que fazer agora" aside={items.length > 0 ? <span>{items.length === 1 ? "1 item" : `${items.length} itens`}</span> : null} className={className}>
      {items.length === 0 ? (
        <FilaVazia />
      ) : (
        <ol className="grid">
          {items.map((item) => (
            <LinhaDaFila key={item.id} item={item} prazo={deadline} />
          ))}
        </ol>
      )}
    </BlocoDoPainel>
  );
}
