import { estiloDoCartao } from "@/components/casal/ui";
import { Esqueleto } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { EsqueletoDeAvatar } from "./primitives";

/**
 * Lista de linhas de 56px, com avatar ou ícone à esquerda.
 *   <SkeletonList rows={6} />   <SkeletonList rows={4} leading="icon" trailing="chip" lines={2} />
 * - leading: "avatar" (círculo de 40px, padrão), "icon" (quadrado de 40px) ou "none".
 * - lines: 1 (só o nome) ou 2 (nome e linha secundária); a altura da linha continua 56px.
 * - trailing: "chip" (status), "action" (botão de ícone) ou "none".
 * - card: dentro do cartão com borda (padrão). `false` é para colocar DENTRO de um <SkeletonCard padded={false}>
 *   (as linhas ganham o respiro lateral do Panel sem padding).
 */
export function EsqueletoDeLista({
  rows = 6,
  leading = "avatar",
  lines = 1,
  trailing = "none",
  card: framed = true,
  className,
}: {
  rows?: number;
  leading?: "avatar" | "icon" | "none";
  lines?: 1 | 2;
  trailing?: "chip" | "action" | "none";
  card?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", framed && cn(estiloDoCartao, "overflow-hidden"), className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={cn("flex h-14 items-center gap-3 border-b border-linha last:border-b-0", framed ? "px-4" : "px-5 md:px-6")}>
          {leading === "avatar" && <EsqueletoDeAvatar />}
          {leading === "icon" && <EsqueletoDeAvatar shape="square" />}
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
            <Esqueleto className={cn("h-4 rounded-md", i % 3 === 0 ? "w-44" : i % 3 === 1 ? "w-36" : "w-52", "max-w-full")} />
            {lines === 2 && <Esqueleto className="h-3 w-28 max-w-full rounded-md" />}
          </div>
          {trailing === "chip" && <Esqueleto className="h-7 w-20 shrink-0 rounded-lg" />}
          {trailing === "action" && <Esqueleto className="size-9 shrink-0 rounded-lg" />}
        </div>
      ))}
    </div>
  );
}

const LARGURAS_DAS_COLUNAS = ["w-20", "w-16", "w-24", "w-14", "w-20"];

/**
 * Tabela que vira cartões no celular (como o ResponsiveTable). As duas versões são renderizadas e o CSS
 * escolhe (md), então não há troca nem salto na hidratação.
 *   <SkeletonTable />   <SkeletonTable columns={5} rows={8} avatar />
 * - columns: colunas no computador (cabeçalho de 44px, linhas de 56px).
 * - avatar: a primeira coluna começa com um avatar (nome de pessoa).
 * - mobileFields: quantos dados aparecem abaixo do título em cada cartão do celular.
 */
interface PropriedadesDaTabela {
  columns?: number;
  rows?: number;
  avatar?: boolean;
  mobileFields?: number;
  className?: string;
}

function TabelaNoComputador({ columns, rows, avatar }: Required<Pick<PropriedadesDaTabela, "columns" | "rows" | "avatar">>) {
  const template = { gridTemplateColumns: `minmax(0, 1.8fr) repeat(${Math.max(columns - 1, 0)}, minmax(0, 1fr))` };
  return (
    <div className="hidden overflow-hidden rounded-2xl border border-linha bg-papel shadow-[var(--shadow-aceito-1)] md:block">
      <div className="grid h-11 items-center gap-3 border-b border-linha px-6" style={template}>
        {Array.from({ length: columns }).map((_, c) => (
          <Esqueleto key={c} className={cn("h-3 rounded-md", c === 0 ? "w-20" : LARGURAS_DAS_COLUNAS[c % LARGURAS_DAS_COLUNAS.length], c === columns - 1 && columns > 2 && "justify-self-end")} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid h-14 items-center gap-3 border-b border-linha px-6 last:border-b-0" style={template}>
          {Array.from({ length: columns }).map((_, c) =>
            c === 0 ? (
              <div key={c} className="flex min-w-0 items-center gap-3">
                {avatar && <EsqueletoDeAvatar />}
                <Esqueleto className={cn("h-4 max-w-full rounded-md", r % 2 ? "w-36" : "w-44")} />
              </div>
            ) : (
              <Esqueleto key={c} className={cn("h-4 rounded-md", LARGURAS_DAS_COLUNAS[(c + r) % LARGURAS_DAS_COLUNAS.length], c === columns - 1 && columns > 2 && "justify-self-end")} />
            ),
          )}
        </div>
      ))}
    </div>
  );
}

function CartoesNoCelular({ rows, avatar, mobileFields }: Required<Pick<PropriedadesDaTabela, "rows" | "avatar" | "mobileFields">>) {
  return (
    <ul className="flex flex-col gap-3 md:hidden">
      {Array.from({ length: rows }).map((_, r) => (
        <li key={r} className="rounded-2xl border border-linha bg-papel p-4 shadow-[var(--shadow-aceito-1)]">
          <div className="flex items-center gap-3">
            {avatar && <EsqueletoDeAvatar />}
            <div className="flex h-6 flex-1 items-center">
              <Esqueleto className={cn("h-4 max-w-full rounded-md", r % 2 ? "w-36" : "w-44")} />
            </div>
          </div>
          {mobileFields > 0 && (
            <div className="mt-3 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
              {Array.from({ length: mobileFields }).map((_, f) => (
                <div key={f} className="col-span-2 grid h-5 grid-cols-subgrid items-center">
                  <Esqueleto className="h-3 w-16 rounded-md" />
                  <Esqueleto className={cn("h-3 rounded-md", f % 2 ? "w-20" : "w-28")} />
                </div>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function EsqueletoDeTabela({ columns = 4, rows = 6, avatar = false, mobileFields = 2, className }: PropriedadesDaTabela) {
  return (
    <div className={cn("min-w-0", className)}>
      <TabelaNoComputador columns={columns} rows={rows} avatar={avatar} />
      {/* Celular: um cartão por linha */}
      <CartoesNoCelular rows={rows} avatar={avatar} mobileFields={mobileFields} />
    </div>
  );
}
