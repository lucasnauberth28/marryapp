import { useState } from "react";
import { ArrowRight, Check, Copy, Globe, Palette } from "lucide-react";
import { TituloDoMolde } from "@/components/account/auth-shell";
import { Selo } from "@/components/landing/seal";
import { estiloDoBotao, estiloDoBotaoComSeta } from "@/components/landing/styles";
import { cn } from "@/lib/utils";
import type { Resultado } from "./use-dados-do-inicio";

function EnderecoDoSite({ sitePath }: { sitePath: string }) {
  const [copied, setCopied] = useState(false);
  // "pronto" só aparece depois de uma ação no navegador: não há renderização no servidor aqui.
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(`${origin}${sitePath}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="flex flex-col gap-2 rounded-[16px] border border-linha bg-papel p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">Endereço do site no Aceito</p>
      <div className="flex items-center gap-2">
        <Globe aria-hidden="true" className="size-[18px] shrink-0 text-ameixa" strokeWidth={1.6} />
        <a href={sitePath} target="_blank" rel="noopener" className="min-w-0 flex-1 break-all font-semibold text-tinta underline decoration-linha underline-offset-4 hover:decoration-ameixa">
          {origin ? `${origin.replace(/^https?:\/\//, "")}${sitePath}` : sitePath}
        </a>
        <button type="button" onClick={copiar} className={cn(estiloDoBotao.quiet, estiloDoBotao.sm, "min-h-11 shrink-0")}>
          {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <p className="text-sm text-tinta-suave" aria-live="polite">
        {copied ? "Link copiado." : "Compartilhem o endereço quando o site estiver do jeito de vocês."}
      </p>
    </div>
  );
}

export function EtapaPronta({ titulo, result }: { titulo: React.RefObject<HTMLHeadingElement | null>; result: Resultado }) {
  return (
    <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
      <Selo label="Casamento criado" className="size-24 [&>span]:text-[54px]" />
      <TituloDoMolde ref={titulo} title="Tudo pronto" text={`O site de ${result.coupleNames} já tem um endereço no Aceito.`} />
      <EnderecoDoSite sitePath={`/casamento/${result.slug}`} />

      {/* Navegação completa: o painel precisa ler o cookie de sessão atualizado no onboarding. */}
      <div className="flex flex-col gap-3">
        <a href="/dashboard" className={cn(estiloDoBotao.primary, estiloDoBotao.block, "min-h-12")}>
          Ir para o painel
          <ArrowRight aria-hidden="true" className={estiloDoBotaoComSeta} />
        </a>
        <a href="/site-builder" className={cn(estiloDoBotao.secondary, estiloDoBotao.block, "min-h-12")}>
          <Palette aria-hidden="true" className="size-4" />
          Escolher cor e fotos do site
        </a>
      </div>
    </section>
  );
}
