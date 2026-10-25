// Peças visuais do Resumo (sem estado: servem aos componentes de servidor e de cliente).
// Regras do painel: bloco com borda de 1px e raio 12, sem sombra; títulos em Urbanist 600; botões, chips e
// segmentos em pílula; números em Geist com algarismos tabulares; estado sempre com ícone e palavra.
import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { formatarReaisSemSinal, separarReais } from "@/lib/dashboard-summary";

const pill =
  "inline-flex min-h-11 shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-full px-[18px] text-sm font-semibold leading-5 no-underline transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100";

export const btnPrimary = `${pill} bg-ameixa text-on-ameixa hover:bg-ameixa-hover`;
export const btnSecondary = `${pill} border border-linha-forte bg-papel text-tinta hover:bg-areia/60`;
/** Botão de linha de tabela e de lista: mesma pílula, um pouco mais baixa no mouse e 44px no toque. */
export const btnRow = `${btnSecondary} min-h-10 px-3.5 pointer-coarse:min-h-11`;

/** Link de texto com seta (cabeçalho de bloco, fim de lista). */
export function TextLink({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={`inline-flex min-h-11 items-center gap-1 rounded-[8px] text-sm font-semibold text-ameixa underline-offset-4 hover:underline ${className}`}>
      {children}
      <ChevronRight className="size-4" aria-hidden="true" />
    </Link>
  );
}

export function Block({
  id,
  title,
  aside,
  children,
  className = "",
}: {
  id?: string;
  title: string;
  /** À direita do título: um link, uma legenda ou um chip. */
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const headingId = id ? `t-${id}` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className={`flex min-w-0 scroll-mt-24 flex-col gap-4 rounded-[12px] border border-linha bg-papel px-4 pb-[18px] pt-4 md:px-6 md:pb-6 md:pt-5 ${className}`}>
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 id={headingId} className="font-display text-[19px] font-semibold leading-[1.25] tracking-[-0.01em] text-tinta">
          {title}
        </h2>
        {aside && <div className="flex flex-wrap items-center gap-2 text-[13px] text-tinta-suave">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

type Tone = "ok" | "aviso" | "perigo" | "neutro" | "ameixa";
const TONES: Record<Tone, string> = {
  ok: "bg-sucesso-suave text-sucesso",
  aviso: "bg-aviso-suave text-aviso",
  perigo: "bg-perigo-suave text-perigo",
  neutro: "bg-areia text-tinta-suave",
  ameixa: "bg-ameixa-suave text-ameixa",
};

/** Chip de estado: sempre um ícone e uma palavra (nunca só a cor). */
export function Chip({ tone, icon: Icon, children }: { tone: Tone; icon?: LucideIcon; children: React.ReactNode }) {
  return (
    <span className={`inline-flex h-6 shrink-0 items-center gap-[5px] whitespace-nowrap rounded-full px-2.5 text-xs font-medium ${TONES[tone]}`}>
      {Icon && <Icon className="size-[13px]" strokeWidth={2.2} aria-hidden="true" />}
      {children}
    </span>
  );
}

/** Valor de destaque: reais em 600, "R$" e centavos menores em tom secundário. O texto completo vai para leitores de tela. */
export function Money({ cents, className = "text-[32px] leading-[1.1]" }: { cents: number; className?: string }) {
  const { whole, cents: c } = separarReais(cents);
  return (
    <span className={`whitespace-nowrap font-semibold tracking-[-0.02em] tabular-nums text-tinta ${className}`}>
      <span className="sr-only">{formatarReaisSemSinal(cents)}</span>
      <span aria-hidden="true">
        <span className="mr-[0.22em] text-[0.56em] font-medium tracking-normal text-tinta-suave">R$</span>
        {whole}
        <span className="ml-[0.04em] inline-block -translate-y-[0.72em] text-[0.5em] font-medium tracking-normal text-tinta-suave">,{c}</span>
      </span>
    </span>
  );
}

/** Barra de segmentos (convites por estado, convites enviados, orçamento pago). `label` descreve tudo para leitores de tela. */
export function Meter({ segments, label, height = 8 }: { segments: { value: number; className: string }[]; label: string; height?: number }) {
  const shown = segments.filter((s) => s.value > 0);
  return (
    <div role="img" aria-label={label} className="flex gap-0.5" style={{ height }}>
      {shown.length === 0 ? <span className="flex-1 rounded-[3px] bg-areia" /> : shown.map((s, i) => <span key={i} className={`min-w-[3px] rounded-[3px] ${s.className}`} style={{ flex: s.value }} />)}
    </div>
  );
}

/** Rótulo pequeno de um número ("Convites confirmados"). */
export const labelClass = "text-[13px] font-medium leading-5 text-tinta-suave";
/** Linha de apoio (13px, tom secundário). */
export const hintClass = "text-[13px] leading-5 text-tinta-suave";
