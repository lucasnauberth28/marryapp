// Blocos do Resumo que só leem dados (componentes de servidor): fila, confirmações, respostas, orçamento e atalhos.
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Armchair, CalendarHeart, Check, Clock, Gift, ListChecks, Minus, Receipt, type LucideIcon } from "lucide-react";
import { LizAvatar, LizIllustration } from "@/components/liz/liz-illustration";
import {
  formatarReaisSemSinal,
  rotuloDeConvites,
  rotuloDePessoas,
  rotuloCurtoDoDia,
  type Orcamento,
  type ContagemDeConvidados,
  type ItemDaFila,
  type TipoDeItemDaFila,
} from "@/lib/dashboard-summary";
import { Block, Chip, Meter, Money, TextLink, btnPrimary, btnSecondary, hintClass, labelClass } from "./ui";

const textButton = "inline-flex min-h-11 items-center rounded-[8px] px-1 text-sm font-semibold text-ameixa underline-offset-4 hover:underline";

const KIND_ICON: Record<Exclude<TipoDeItemDaFila, "liz">, LucideIcon> = { pix: Gift, despesa: Receipt, data: CalendarHeart, tarefa: ListChecks, mesas: Armchair };

/** Ação de um item: link interno ou âncora da própria página. */
function ItemLink({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
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

/** "O que fazer agora": até 3 itens; o primeiro é a sugestão da Liz. */
export function QueueBlock({
  items,
  deadline,
  className = "",
}: {
  items: ItemDaFila[];
  /** Prazo de confirmação chegando: o primeiro item ganha o chip e o botão de lembrar quem não respondeu. */
  deadline: { chip: string; remindHref: string } | null;
  className?: string;
}) {
  return (
    <Block id="agora" title="O que fazer agora" aside={items.length > 0 ? <span>{items.length === 1 ? "1 item" : `${items.length} itens`}</span> : null} className={className}>
      {items.length === 0 ? (
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
          <LizIllustration pose="tranquila" height={88} decorative className="h-[88px] w-auto" />
          <div className="grid gap-1">
            <p className="text-[14.5px] font-semibold text-tinta">Nada pedindo atenção agora</p>
            <p className="text-[14.5px] leading-[1.45] text-tinta-suave">Quando surgir algo, como um convite sem resposta ou um Pix para conferir, aparece aqui.</p>
          </div>
        </div>
      ) : (
        <ol className="grid">
          {items.map((item) => {
            const Icon = item.kind === "liz" ? null : KIND_ICON[item.kind];
            const urgentDeadline = item.kind === "liz" && deadline && item.id === "rsvp-sem-resposta";
            return (
              <li key={item.id} className="grid grid-cols-[40px_minmax(0,1fr)] gap-x-3.5 gap-y-1 border-t border-linha py-3.5 first:border-t-0 first:pt-0 last:pb-0">
                {Icon ? (
                  <span className={`grid size-10 place-items-center rounded-full ${item.kind === "pix" || item.kind === "despesa" ? "bg-aviso-suave text-aviso" : "bg-areia text-tinta-suave"}`}>
                    <Icon className="size-[19px]" strokeWidth={1.6} aria-hidden="true" />
                  </span>
                ) : (
                  <LizAvatar size={40} decorative />
                )}
                <div className="grid min-h-10 content-center gap-0.5">
                  {item.kind === "liz" && <strong className="text-[13px] font-semibold text-ameixa">A Liz sugere o próximo passo</strong>}
                  <p className="text-pretty text-[14.5px] leading-[1.45] text-tinta">{item.text}</p>
                </div>
                {(item.action || urgentDeadline) && (
                  <div className="col-start-2 flex flex-wrap items-center gap-2">
                    {urgentDeadline && (
                      <>
                        <Chip tone="aviso" icon={Clock}>
                          {deadline.chip}
                        </Chip>
                        <ItemLink href={deadline.remindHref} className={btnPrimary}>
                          Lembrar quem não respondeu
                        </ItemLink>
                      </>
                    )}
                    {item.action &&
                      (item.kind !== "liz" ? (
                        <TextLink href={item.action.href}>{item.action.label}</TextLink>
                      ) : (
                        <ItemLink href={item.action.href} className={urgentDeadline ? textButton : btnSecondary}>
                          {item.action.label}
                        </ItemLink>
                      ))}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Block>
  );
}

/** Um número do bloco de confirmações: rótulo, valor, unidade e contexto. */
function Figure({ label, value, unit, hint }: { label: string; value: number; unit: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-1 border-linha px-5 first:pl-0 first:border-l-0 max-md:[&:nth-child(3)]:col-span-full max-md:[&:nth-child(3)]:border-l-0 max-md:[&:nth-child(3)]:border-t max-md:[&:nth-child(3)]:px-0 max-md:[&:nth-child(3)]:pt-3.5 md:border-l">
      <span className={labelClass}>{label}</span>
      <span className="text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] tabular-nums text-tinta">
        {value.toLocaleString("pt-BR")}{" "}
        <span className="mt-1 block text-sm font-medium tracking-normal text-tinta-suave">{unit}</span>
      </span>
      {hint && <span className={hintClass}>{hint}</span>}
    </div>
  );
}

export function ConfirmationsBlock({
  counts,
  deadlineHint,
  deadlineChip,
  canOpenList,
  className = "",
}: {
  counts: ContagemDeConvidados;
  /** "Prazo em 15 mar 2027", quando o casal definiu um. */
  deadlineHint: string | null;
  /** Prazo chegando: troca a dica por um chip de atenção. */
  deadlineChip: string | null;
  canOpenList: boolean;
  className?: string;
}) {
  const { invites: c, people: p } = counts;
  return (
    <Block id="confirmacoes" title="Confirmações de presença" aside={canOpenList ? <TextLink href="/convidados">Ver lista</TextLink> : null} className={className}>
      <div className="grid grid-cols-2 gap-y-4 md:grid-cols-3">
        <Figure label="Convites confirmados" value={c.confirmed} unit={`de ${rotuloDeConvites(c.total)}`} />
        <Figure label="Pessoas confirmadas" value={p.confirmed} unit={`de ${rotuloDePessoas(p.total)}`} hint="Número para o buffet" />
        <Figure
          label="Sem resposta"
          value={c.pending}
          unit={`${c.pending === 1 ? "convite" : "convites"} · ${rotuloDePessoas(p.pending)}`}
          hint={deadlineChip ? <Chip tone="aviso" icon={Clock}>{deadlineChip}</Chip> : deadlineHint}
        />
      </div>
      <div className="grid gap-2.5">
        <Meter
          height={10}
          label={`${c.confirmed} convites confirmados, ${c.declined} não vão e ${c.pending} sem resposta, de ${c.total} convites`}
          segments={[
            { value: c.confirmed, className: "bg-sucesso" },
            { value: c.declined, className: "bg-linha-forte" },
            { value: c.pending, className: "bg-areia" },
          ]}
        />
        <ul className="flex flex-wrap gap-x-[18px] gap-y-1.5 text-[13px] text-tinta-suave">
          <li className="flex items-center gap-1.5">
            <Check className="size-3.5" aria-hidden="true" />
            <i className="block size-2.5 rounded-[3px] bg-sucesso" aria-hidden="true" />
            Confirmados <b className="font-semibold tabular-nums text-tinta">{rotuloDeConvites(c.confirmed)}</b>
          </li>
          <li className="flex items-center gap-1.5">
            <Minus className="size-3.5" aria-hidden="true" />
            <i className="block size-2.5 rounded-[3px] bg-linha-forte" aria-hidden="true" />
            Não vão <b className="font-semibold tabular-nums text-tinta">{rotuloDeConvites(c.declined)}</b>
          </li>
          <li className="flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden="true" />
            <i className="block size-2.5 rounded-[3px] bg-areia ring-1 ring-inset ring-linha" aria-hidden="true" />
            Sem resposta <b className="font-semibold tabular-nums text-tinta">{rotuloDeConvites(c.pending)}</b>
          </li>
        </ul>
      </div>
    </Block>
  );
}

export interface ResponseRow {
  id: string;
  name: string;
  yes: boolean;
  people: number;
  at: Date;
}

const initialsOf = (name: string) => {
  const words = name.trim().split(/\s+/).filter((w) => w.length > 2 || /^\p{Lu}/u.test(w));
  return words.slice(0, 2).map((w) => w[0]).join("").toUpperCase() || name.trim().slice(0, 1).toUpperCase();
};

/** Últimas respostas (a hora é a da última alteração do convite: o banco ainda não guarda quando a pessoa respondeu). */
export function ResponsesBlock({ rows, canOpenList, className = "" }: { rows: ResponseRow[]; canOpenList: boolean; className?: string }) {
  return (
    <Block id="respostas" title="Últimas respostas" aside={canOpenList && rows.length > 0 ? <TextLink href="/convidados">Ver todas</TextLink> : null} className={className}>
      {rows.length === 0 ? (
        <p className="text-[14.5px] leading-[1.45] text-tinta-suave">Nenhum convidado respondeu ainda. As respostas aparecem aqui assim que chegarem.</p>
      ) : (
        <ul>
          {rows.map((r) => (
            <li key={r.id} className="grid min-h-[60px] grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 border-t border-linha py-2 first:border-t-0 first:pt-0 last:pb-0">
              <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-areia text-xs font-semibold text-tinta-suave">
                {initialsOf(r.name)}
              </span>
              <div className="grid min-w-0">
                <b className="truncate font-semibold text-tinta">{r.name}</b>
                <small className="text-[13px] text-tinta-suave">
                  {rotuloDePessoas(r.people)} · {formatDistanceToNowStrict(r.at, { addSuffix: true, locale: ptBR })}
                </small>
              </div>
              {r.yes ? (
                <Chip tone="ok" icon={Check}>
                  Confirmado
                </Chip>
              ) : (
                <Chip tone="neutro" icon={Minus}>
                  Não vai
                </Chip>
              )}
            </li>
          ))}
        </ul>
      )}
    </Block>
  );
}

export function BudgetBlock({ budget, canOpen, className = "" }: { budget: Orcamento; canOpen: boolean; className?: string }) {
  const hasExpenses = budget.totalCents > 0;
  return (
    <Block id="orcamento" title="Orçamento" aside={canOpen && hasExpenses ? <TextLink href="/financas">Ver despesas</TextLink> : null} className={className}>
      {!hasExpenses ? (
        <div className="grid max-w-[60ch] gap-1.5">
          <b className="text-[15px] text-tinta">Nenhuma despesa anotada</b>
          <p className="text-pretty text-tinta-suave">Anotem o que já contrataram (buffet, fotografia, vestido) para saber quanto já pagaram e quanto falta.</p>
          {canOpen && (
            <div className="mt-2">
              <Link href="/financas" className={btnSecondary}>
                <Receipt className="size-[17px]" aria-hidden="true" />
                Adicionar despesa
              </Link>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-2">
            <span className={labelClass}>Pago até agora</span>
            <span className="flex flex-wrap items-baseline gap-x-2">
              <Money cents={budget.paidCents} className="text-[28px] leading-[1.1]" />
              <span className="text-[15px] font-medium text-tinta-suave tabular-nums">de {formatarReaisSemSinal(budget.totalCents)}</span>
            </span>
            <Meter
              label={`${budget.pct}% das despesas pagas`}
              segments={[
                { value: budget.paidCents, className: "bg-ameixa" },
                { value: budget.leftCents, className: "bg-areia" },
              ]}
            />
            <span className={hintClass}>
              <b className="font-semibold tabular-nums text-tinta">{budget.pct}%</b> pago · faltam <b className="font-semibold tabular-nums text-tinta">{formatarReaisSemSinal(budget.leftCents)}</b>
            </span>
          </div>
          {budget.upcoming.length > 0 && (
            <div>
              <h3 className={`${labelClass} mb-1`}>Próximas despesas</h3>
              <ul>
                {budget.upcoming.map((u) => (
                  <li key={u.id} className="grid min-h-[60px] grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-3 border-t border-linha py-2 first:border-t-0">
                    <span className="grid justify-items-center rounded-[8px] border border-linha bg-areia/40 py-1 leading-[1.15]">
                      <b className="text-base font-semibold tabular-nums">{Number(u.dueKey.slice(8, 10))}</b>
                      <small className="text-[11.5px] text-tinta-suave">{rotuloCurtoDoDia(u.dueKey).split(" ")[1]}</small>
                    </span>
                    <div className="grid min-w-0 gap-0.5">
                      <b className="truncate font-medium text-tinta">{u.name}</b>
                      <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-tinta-suave">
                        {u.detail}
                        {u.days < 0 ? (
                          <Chip tone="perigo" icon={Clock}>
                            Atrasada
                          </Chip>
                        ) : u.days <= 10 ? (
                          <Chip tone="aviso" icon={Clock}>
                            {u.days === 0 ? "Vence hoje" : `Vence em ${u.days} ${u.days === 1 ? "dia" : "dias"}`}
                          </Chip>
                        ) : null}
                      </span>
                    </div>
                    <span className="whitespace-nowrap text-right font-medium tabular-nums">{formatarReaisSemSinal(u.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </Block>
  );
}

export interface Shortcut {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function Shortcuts({ items }: { items: Shortcut[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-labelledby="t-atalhos" className="flex flex-wrap items-center gap-2 min-[1200px]:col-span-12">
      <h2 id="t-atalhos" className="mr-2 text-[13px] font-medium text-tinta-suave">
        Atalhos
      </h2>
      {items.map(({ href, label, icon: Icon }) => (
        <Link key={label} href={href} className={btnSecondary}>
          <Icon className="size-[17px]" aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
