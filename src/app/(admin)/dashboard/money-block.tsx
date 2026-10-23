// Presentes e dinheiro no Resumo: um extrato só (recebido bruto, taxa do Aceito, líquido e a conferir).
import Link from "next/link";
import { Check, Clock, Gift } from "lucide-react";
import { GIFT_FEE_LABEL, type GiftFeePlan, giftAmounts } from "@/lib/gift-fee";
import { formatBRL, formatBRLOut, shortDayLabel, dayKeyOf, type GiftLine, type GiftStatement } from "@/lib/dashboard-summary";
import { Block, Chip, Money, TextLink, btnPrimary, hintClass, labelClass } from "./ui";
import { ConferirButton, PixSeal } from "./conferir-button";

const plural = (n: number, one: string, many: string) => `${n.toLocaleString("pt-BR")} ${n === 1 ? one : many}`;

/** Em que a taxa se aplica no plano, em uma frase. */
function feeNote(plan: GiftFeePlan): string {
  if (plan === "basic") return `${GIFT_FEE_LABEL} por presente no plano Básico`;
  return `Pix sem taxa no plano ${plan === "vip" ? "VIP" : "Classic"}; cartão ${GIFT_FEE_LABEL}`;
}

/** Linhas do extrato (a mesma conta para o extrato de verdade e para o exemplo). */
function Statement({ rows, label }: { rows: React.ReactNode; label: string }) {
  return (
    <dl aria-label={label} className="grid border-t border-linha">
      {rows}
    </dl>
  );
}

function Row({ term, note, meta, value, tone, total = false }: { term: React.ReactNode; note?: React.ReactNode; meta?: React.ReactNode; value: string; tone?: "saida" | "conferir"; total?: boolean }) {
  return (
    <div className={`grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-0.5 border-b border-linha py-1.5 sm:grid-cols-[minmax(0,1fr)_auto_auto] ${total ? "-mt-px border-t border-dashed border-t-linha-forte" : ""}`}>
      <dt className={`text-sm ${total ? "font-semibold" : ""} ${tone === "conferir" ? "flex flex-wrap items-center gap-2" : ""}`}>
        {term}
        {note && <small className="block text-[12.5px] font-normal text-tinta-suave">{note}</small>}
      </dt>
      <span className="col-start-1 row-start-2 text-left text-[13px] tabular-nums text-tinta-suave sm:col-start-auto sm:row-start-auto sm:text-right">{meta}</span>
      <dd className={`col-start-2 row-start-1 min-w-[9ch] whitespace-nowrap text-right font-medium tabular-nums sm:col-start-auto sm:row-start-auto ${total ? "text-base font-semibold" : "text-[15px]"} ${tone === "saida" ? "text-tinta-suave" : tone === "conferir" ? "text-aviso" : ""}`}>{value}</dd>
    </div>
  );
}

export function MoneyBlock({
  statement,
  lines,
  plan,
  giftCount,
  canOpenGifts,
  canReceive,
  canConfer,
  className = "",
}: {
  statement: GiftStatement;
  lines: GiftLine[];
  plan: GiftFeePlan;
  giftCount: number;
  canOpenGifts: boolean;
  /** O perfil abre as Configurações (onde fica "Onde receber"). */
  canReceive: boolean;
  /** O perfil confere Pix (mesma permissão de Finanças). */
  canConfer: boolean;
  className?: string;
}) {
  const empty = statement.approvedCount === 0 && statement.toCheckCount === 0;
  const aside = (
    <>
      {canReceive && <TextLink href="/configuracoes/recebimento">Onde receber</TextLink>}
      {canOpenGifts && !empty && <TextLink href="/presentes-admin">Ver presentes</TextLink>}
    </>
  );

  if (empty) {
    // Exemplo de como um presente de R$ 300,00 aparece, com a taxa do plano de vocês (marcado, nunca como se fosse real)
    const ex = giftAmounts(30_000, plan, "PIX");
    return (
      <Block id="dinheiro" title="Presentes e dinheiro" aside={aside} className={className}>
        <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <div className="grid max-w-[60ch] gap-1.5">
            <b className="text-[15px] text-tinta">Nenhum presente recebido ainda</b>
            <p className="text-pretty text-tinta-suave">
              {giftCount === 0
                ? "Criem os presentes em dinheiro que vão aparecer no site. O convidado paga por Pix ou cartão e o valor aparece aqui, com a taxa e o líquido de cada presente."
                : "Os presentes de vocês já estão no site. Quando um convidado pagar por Pix ou cartão, o valor aparece aqui, com a taxa e o líquido de cada presente."}
            </p>
            {canOpenGifts && giftCount === 0 && (
              <div className="mt-2">
                <Link href="/presentes-admin" className={btnPrimary}>
                  <Gift className="size-[17px]" aria-hidden="true" />
                  Criar o primeiro presente
                </Link>
              </div>
            )}
          </div>
          <div className="relative rounded-[8px] border border-dashed border-linha-forte bg-areia/40 p-4 pt-5" role="group" aria-label="Exemplo de um presente de R$ 300,00">
            <span className="absolute -top-3 left-3">
              <Chip tone="neutro">Exemplo</Chip>
            </span>
            <Statement
              label="Exemplo de um presente de R$ 300,00"
              rows={
                <>
                  <Row term="Presente de exemplo" value={formatBRL(ex.grossCents)} />
                  <Row term="Taxa do Aceito" note={feeNote(plan)} value={ex.feeCents > 0 ? formatBRLOut(ex.feeCents) : formatBRL(0)} tone="saida" />
                  <Row term="Vocês recebem" value={formatBRL(ex.netCents)} total />
                </>
              }
            />
          </div>
        </div>
      </Block>
    );
  }

  return (
    <Block id="dinheiro" title="Presentes e dinheiro" aside={aside} className={className}>
      <div className="grid gap-1">
        <span className={labelClass}>Líquido para vocês</span>
        <Money cents={statement.netCents} className="text-[36px] leading-[1.1]" />
        <span className={hintClass}>
          {statement.approvedCount === 0
            ? "Nenhum presente conferido ainda"
            : `${plural(statement.approvedCount, "presente recebido", "presentes recebidos")} · ${statement.pixCount} por Pix e ${statement.cardCount} por cartão`}
        </span>
      </div>

      <Statement
        label="Extrato dos presentes"
        rows={
          <>
            <Row term="Recebido (bruto)" note="O que os convidados pagaram" meta={plural(statement.approvedCount, "presente", "presentes")} value={formatBRL(statement.grossCents)} />
            <Row term="Taxa do Aceito" note={feeNote(plan)} value={statement.feeCents > 0 ? formatBRLOut(statement.feeCents) : formatBRL(0)} tone="saida" />
            <Row term="Líquido para vocês" value={formatBRL(statement.netCents)} total />
            <Row
              tone="conferir"
              term={
                statement.toCheckCount > 0 ? (
                  <>
                    <Chip tone="aviso" icon={Clock}>
                      A conferir
                    </Chip>
                    Pix que vocês ainda não conferiram
                  </>
                ) : (
                  <Chip tone="ok" icon={Check}>
                    Tudo conferido
                  </Chip>
                )
              }
              meta={statement.toCheckCount > 0 ? `${statement.toCheckCount} Pix` : undefined}
              value={formatBRL(statement.toCheckCents)}
            />
          </>
        }
      />
      <p className={hintClass}>Um Pix a conferir entra no recebido quando vocês confirmam que ele caiu na conta.</p>

      {lines.length > 0 && (
        <div className="overflow-hidden rounded-[8px] border border-linha">
          <table className="w-full border-collapse text-sm max-md:block">
            <caption className="px-3.5 pb-1 pt-3 text-left text-sm font-semibold max-md:block">
              Últimos presentes <span className="ml-1.5 text-[13px] font-normal text-tinta-suave">valor, taxa e quanto vocês recebem</span>
            </caption>
            <thead className="max-md:sr-only">
              <tr>
                <th scope="col" className="whitespace-nowrap border-b border-linha px-3 py-2 text-left text-[12.5px] font-medium text-tinta-suave">Convidado</th>
                <th scope="col" className="whitespace-nowrap border-b border-linha px-3 py-2 text-right text-[12.5px] font-medium text-tinta-suave">Valor e taxa</th>
                <th scope="col" className="whitespace-nowrap border-b border-linha px-3 py-2 text-right text-[12.5px] font-medium text-tinta-suave">Vocês recebem</th>
                <th scope="col" className="whitespace-nowrap border-b border-linha px-3 py-2 text-right text-[12.5px] font-medium text-tinta-suave">Situação</th>
              </tr>
            </thead>
            <tbody className="max-md:block">
              {lines.map((l) => (
                <tr key={l.tx.id} className="border-t border-linha first:border-t-0 max-md:grid max-md:grid-cols-[minmax(0,1fr)_auto] max-md:gap-x-3 max-md:gap-y-0.5 max-md:px-3.5 max-md:py-3">
                  <td className="h-14 px-3 align-middle max-md:col-start-1 max-md:row-start-1 max-md:h-auto max-md:p-0">
                    <div className="grid">
                      <b className="font-semibold text-tinta">{l.tx.who}</b>
                      <small className="flex flex-wrap items-center gap-x-1.5 text-[12.5px] text-tinta-suave tabular-nums">
                        {shortDayLabel(dayKeyOf(l.tx.createdAt))} · {l.tx.method === "PIX" ? "Pix" : "Cartão"}
                        {l.toCheck && (
                          <Chip tone="aviso" icon={Clock}>
                            A conferir
                          </Chip>
                        )}
                      </small>
                    </div>
                  </td>
                  <td className="px-3 text-right align-middle tabular-nums max-md:col-start-2 max-md:row-start-1 max-md:p-0">
                    <div className="grid">
                      <span className="whitespace-nowrap">{formatBRL(l.grossCents)}</span>
                      <small className="whitespace-nowrap text-[12.5px] text-tinta-suave">taxa {formatBRL(l.feeCents)}</small>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 text-right align-middle tabular-nums max-md:col-start-2 max-md:row-start-2 max-md:p-0 max-md:text-[13px]">
                    <span className="hidden text-tinta-suave max-md:inline">recebem </span>
                    {formatBRL(l.netCents)}
                  </td>
                  <td className="whitespace-nowrap px-3 text-right align-middle max-md:col-start-1 max-md:row-start-2 max-md:p-0 max-md:text-left">
                    {l.toCheck ? (
                      canConfer ? (
                        <ConferirButton transactionId={l.tx.id} giftId={l.tx.giftId} who={l.tx.who} />
                      ) : (
                        <span className="text-[13px] text-tinta-suave">A conferir</span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-2 text-[13px] text-tinta-suave">
                        <PixSeal />
                        Conferido
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Block>
  );
}
