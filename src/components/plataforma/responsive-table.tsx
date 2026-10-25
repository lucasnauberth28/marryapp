import Link from "next/link";
import type { ReactNode } from "react";
import { estiloDoTituloDaColunaDoCasal } from "@/components/casal/ui";
import { cn } from "@/lib/utils";

/**
 * Tabela que vira lista de cartões no celular (sem rolagem lateral). Componente de servidor: as funções
 * `cell` podem usar qualquer JSX e vêm direto da página.
 *
 *   <ResponsiveTable
 *     caption="Casais"
 *     rows={casais}
 *     rowKey={(c) => c.id}
 *     rowHref={(c) => `/admin/casais/${c.id}`}
 *     columns={[
 *       { key: "casal", header: "Casal", primary: true, cell: (c) => <>…nome e e-mail…</> },
 *       { key: "data", header: "Casamento", cell: (c) => formatDate(c.date) },
 *       { key: "valor", header: "Presentes", align: "right", cell: (c) => formatBRL(c.total) },
 *       { key: "tag", header: "Situação", mobileLabel: false, cell: (c) => <StatusChip …/> },
 *     ]}
 *   />
 *
 * - primary: a coluna que vira o título do cartão no celular (e o link da linha quando há rowHref).
 * - mobileLabel: texto do rótulo no cartão (padrão: o header, se for texto); `false` mostra só o valor.
 * - hideOnMobile: some no celular (ex.: colunas redundantes).
 * - rowHref: a linha inteira leva ao destino (link esticado sobre o título); botões dentro da linha continuam clicáveis
 *   se tiverem `relative z-10`.
 * - renderCard: troca o cartão do celular por um desenho próprio.
 * - selectedKey: destaca a linha escolhida (painel lateral aberto).
 * - empty: o que mostrar sem linhas (<EmptyState/>); a tabela some e o cabeçalho continua, como no desenho.
 * Quando precisar de checkbox por linha ou ordenação no navegador, componha uma versão cliente na própria tela.
 */
export interface Coluna<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
  primary?: boolean;
  mobileLabel?: string | false;
  hideOnMobile?: boolean;
  className?: string;
}

interface PropriedadesDaTabela<T> {
  caption: string;
  columns: Coluna<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string | null;
  renderCard?: (row: T) => ReactNode;
  selectedKey?: string | null;
  empty?: ReactNode;
  className?: string;
}

type Compartilhadas<T> = Pick<PropriedadesDaTabela<T>, "columns" | "rows" | "rowKey" | "rowHref" | "selectedKey" | "empty">;

function LinhaDaTabela<T>({ row, columns, primary, href, selecionada }: { row: T; columns: Coluna<T>[]; primary: Coluna<T>; href: string | null; selecionada: boolean }) {
  return (
    <tr className={cn("relative border-b border-linha last:border-b-0", selecionada ? "bg-ameixa-suave" : href && "hover:bg-linho")}>
      {columns.map((c, i) => (
        <td key={c.key} className={cn("px-3 py-3 align-middle first:pl-6 last:pr-6", c.align === "right" && "text-right tabular-nums", c.className)}>
          {href && c === primary ? (
            <Link href={href} className="font-semibold text-tinta after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ameixa">
              {c.cell(row)}
            </Link>
          ) : (
            <span className={cn(i > 0 && href && "relative")}>{c.cell(row)}</span>
          )}
        </td>
      ))}
    </tr>
  );
}

function TabelaNoComputador<T>({ caption, primary, ...c }: Compartilhadas<T> & { caption: string; primary: Coluna<T> }) {
  return (
    <div className="hidden overflow-x-auto rounded-2xl border border-linha bg-papel shadow-[var(--shadow-aceito-1)] md:block">
      <table className="w-full border-collapse text-left text-[15px] leading-5">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-linha">
            {c.columns.map((col) => (
              <th key={col.key} scope="col" className={cn(estiloDoTituloDaColunaDoCasal, "normal-case tracking-normal text-[13px]", col.align === "right" && "text-right")}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        {c.rows.length > 0 && (
          <tbody>
            {c.rows.map((row) => {
              const key = c.rowKey(row);
              return <LinhaDaTabela key={key} row={row} columns={c.columns} primary={primary} href={c.rowHref?.(row) ?? null} selecionada={c.selectedKey === key} />;
            })}
          </tbody>
        )}
      </table>
      {c.rows.length === 0 && c.empty}
    </div>
  );
}

function CartaoDaLinha<T>({ row, primary, others, href, selecionada }: { row: T; primary: Coluna<T>; others: Coluna<T>[]; href: string | null; selecionada: boolean }) {
  return (
    <li className={cn("relative rounded-2xl border border-linha bg-papel p-4 shadow-[var(--shadow-aceito-1)]", selecionada && "border-ameixa bg-ameixa-suave")}>
      <div className="font-semibold leading-6 text-tinta">
        {href ? (
          <Link href={href} className="after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ameixa">
            {primary.cell(row)}
          </Link>
        ) : (
          primary.cell(row)
        )}
      </div>
      {others.length > 0 && (
        <dl className="mt-3 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-sm leading-5">
          {others.map((c) => {
            const label = c.mobileLabel === undefined ? (typeof c.header === "string" ? c.header : null) : c.mobileLabel || null;
            return (
              <div key={c.key} className="relative col-span-2 grid grid-cols-subgrid items-center">
                {label ? <dt className="text-tinta-suave">{label}</dt> : <dt className="sr-only">{typeof c.header === "string" ? c.header : c.key}</dt>}
                <dd className={cn("min-w-0 text-tinta", !label && "col-span-2")}>{c.cell(row)}</dd>
              </div>
            );
          })}
        </dl>
      )}
    </li>
  );
}

function CartoesNoCelular<T>({ renderCard, primary, others, ...c }: Compartilhadas<T> & { renderCard?: (row: T) => ReactNode; primary: Coluna<T>; others: Coluna<T>[] }) {
  if (c.rows.length === 0) {
    return (
      <div className="md:hidden">
        <div className="rounded-2xl border border-linha bg-papel shadow-[var(--shadow-aceito-1)]">{c.empty}</div>
      </div>
    );
  }
  return (
    <div className="md:hidden">
      <ul className="flex flex-col gap-3">
        {c.rows.map((row) => {
          const key = c.rowKey(row);
          if (renderCard) return <li key={key}>{renderCard(row)}</li>;
          return <CartaoDaLinha key={key} row={row} primary={primary} others={others} href={c.rowHref?.(row) ?? null} selecionada={c.selectedKey === key} />;
        })}
      </ul>
    </div>
  );
}

export function TabelaResponsiva<T>({ caption, columns, rows, rowKey, rowHref, renderCard, selectedKey, empty, className }: PropriedadesDaTabela<T>) {
  const primary = columns.find((c) => c.primary) ?? columns[0];
  const others = columns.filter((c) => c !== primary && !c.hideOnMobile);
  const comum = { columns, rows, rowKey, rowHref, selectedKey, empty };

  return (
    <div className={cn("min-w-0", className)}>
      {/* Computador */}
      <TabelaNoComputador caption={caption} primary={primary} {...comum} />
      {/* Celular: um cartão por linha */}
      <CartoesNoCelular renderCard={renderCard} primary={primary} others={others} {...comum} />
    </div>
  );
}
