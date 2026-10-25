import type { ReactNode } from "react";
import { estiloDoCartao } from "@/components/casal/ui";
import { Esqueleto } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { EsqueletoDeAvatar, EsqueletoDeTexto } from "./primitives";

/* Blocos grandes do esqueleto. Alturas e espaçamentos espelham os componentes reais
   (PageHeader, StatCard, Panel, ResponsiveTable, campos flutuantes) para não haver salto de layout. */

/**
 * Cabeçalho de página: sobretítulo, título (fonte display), descrição e botões.
 *   <SkeletonPageHeader />   <SkeletonPageHeader eyebrow={false} actions={2} breadcrumb />
 * - eyebrow / description: desligue quando a página real não tem.
 * - actions: quantos botões à direita (44px de altura); 0 não mostra nada.
 * - breadcrumb: trilha acima do sobretítulo (páginas de detalhe).
 */
export function EsqueletoDoCabecalhoDaPagina({
  eyebrow = true,
  description = true,
  actions = 0,
  breadcrumb = false,
  className,
}: {
  eyebrow?: boolean;
  description?: boolean;
  actions?: number;
  breadcrumb?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0 max-w-3xl flex-1">
        {breadcrumb && (
          <div className="mb-4 flex h-5 items-center gap-2">
            <Esqueleto className="h-3.5 w-16 rounded-md" />
            <Esqueleto className="h-3.5 w-24 rounded-md" />
          </div>
        )}
        {eyebrow && (
          <div className="mb-1 flex h-4 items-center">
            <Esqueleto className="h-3 w-28 rounded-md" />
          </div>
        )}
        <div className="flex h-9 items-center md:h-[46px]">
          <Esqueleto className="h-7 w-3/4 max-w-sm rounded-lg md:h-9" />
        </div>
        {description && (
          <div className="mt-1.5 flex h-6 items-center">
            <Esqueleto className="h-4 w-full max-w-md rounded-md" />
          </div>
        )}
      </div>
      {actions > 0 && (
        <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:justify-end">
          {Array.from({ length: actions }).map((_, i) => (
            <Esqueleto key={i} className={cn("h-11 rounded-xl", i === 0 ? "w-36" : "w-28")} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Cartão de número (StatCard): sobretítulo, número grande e dica.
 *   <SkeletonStat />   <SkeletonStat hint={false} className="p-4 sm:p-5" />
 */
export function EsqueletoDeIndicador({ hint = true, className }: { hint?: boolean; className?: string }) {
  return (
    <div className={cn(estiloDoCartao, "block p-5", className)}>
      <div className="flex h-4 items-center">
        <Esqueleto className="h-3 w-24 rounded-md" />
      </div>
      <div className="mt-2 flex h-10 items-center md:h-11">
        <Esqueleto className="h-8 w-28 rounded-lg" />
      </div>
      {hint && (
        <div className="mt-2 flex h-5 items-center">
          <Esqueleto className="h-3 w-36 rounded-md" />
        </div>
      )}
    </div>
  );
}

/** Grade de números (StatGrid): 1 coluna no celular, 2 no tablet, `cols` (padrão 4) no computador. */
export function EsqueletoDaGradeDeIndicadores({
  count = 4,
  cols = 4,
  hint = true,
  className,
}: {
  count?: number;
  cols?: 2 | 3 | 4;
  hint?: boolean;
  className?: string;
}) {
  const lg = cols === 4 ? "lg:grid-cols-4" : cols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", lg, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <EsqueletoDeIndicador key={i} hint={hint} />
      ))}
    </div>
  );
}

/**
 * Cartão com título (Panel). Sem `children`, mostra 3 linhas de texto.
 *   <SkeletonCard />   <SkeletonCard title={false} padded={false}><SkeletonList card={false} /></SkeletonCard>
 *   <SkeletonCard description><SkeletonChart /></SkeletonCard>
 * - title: linha do título do cartão (28px). description: linha de descrição abaixo dele.
 * - padded={false}: sem respiro interno (listas e tabelas até a borda); o título ganha o respiro próprio.
 */
export function EsqueletoDeCartao({
  title = true,
  description = false,
  padded = true,
  className,
  children,
}: {
  title?: boolean;
  description?: boolean;
  padded?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn(estiloDoCartao, "min-w-0", padded && "p-5 md:p-6", className)}>
      {title && (
        <div className={cn("mb-4 flex h-7 items-center", !padded && "px-5 pt-5 md:px-6 md:pt-6")}>
          <Esqueleto className="h-5 w-40 rounded-md" />
        </div>
      )}
      {description && (
        <div className={cn("-mt-2 mb-4 flex h-5 items-center", !padded && "px-5 md:px-6")}>
          <Esqueleto className="h-3 w-56 max-w-full rounded-md" />
        </div>
      )}
      {children ?? <EsqueletoDeTexto lines={3} />}
    </div>
  );
}

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
export function EsqueletoDeTabela({
  columns = 4,
  rows = 6,
  avatar = false,
  mobileFields = 2,
  className,
}: {
  columns?: number;
  rows?: number;
  avatar?: boolean;
  mobileFields?: number;
  className?: string;
}) {
  const template = { gridTemplateColumns: `minmax(0, 1.8fr) repeat(${Math.max(columns - 1, 0)}, minmax(0, 1fr))` };
  return (
    <div className={cn("min-w-0", className)}>
      {/* Computador */}
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

      {/* Celular: um cartão por linha */}
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
    </div>
  );
}

type CampoDoFormulario = "input" | "textarea";

/**
 * Formulário com campos de rótulo flutuante (48px; área de texto de 96px), com o rótulo "em repouso" dentro.
 *   <SkeletonForm fields={4} />
 *   <SkeletonForm fields={["input", "input", "textarea"]} columns={2} submit={false} />
 * - fields: número de campos de linha única, ou a lista de tipos na ordem da tela.
 * - columns: 2 divide em duas colunas a partir do tablet (a área de texto ocupa a linha inteira).
 * - submit: botão principal de 44px no fim.
 */
export function EsqueletoDeFormulario({
  fields = 4,
  columns = 1,
  submit = true,
  className,
}: {
  fields?: number | CampoDoFormulario[];
  columns?: 1 | 2;
  submit?: boolean;
  className?: string;
}) {
  const list: CampoDoFormulario[] = typeof fields === "number" ? Array.from({ length: fields }, () => "input") : fields;
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className={cn("grid gap-4", columns === 2 && "sm:grid-cols-2")}>
        {list.map((kind, i) => (
          <div
            key={i}
            className={cn(
              "flex rounded-xl border border-linha bg-papel px-4",
              kind === "textarea" ? "min-h-24 items-start pt-[18px] sm:col-span-full" : "h-12 items-center",
            )}
          >
            <Esqueleto className={cn("h-3 rounded-md", i % 3 === 0 ? "w-28" : i % 3 === 1 ? "w-20" : "w-36")} />
          </div>
        ))}
      </div>
      {submit && <Esqueleto className="h-11 w-36 rounded-xl" />}
    </div>
  );
}
