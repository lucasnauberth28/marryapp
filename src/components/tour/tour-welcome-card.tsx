"use client";

import { useEffect, useRef } from "react";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Cartão de boas-vindas ao painel. Não bloqueia nada: fica no canto (acima da barra inferior no celular),
 * recebe o foco ao abrir e "Esc" é o mesmo que "Agora não".
 */
export function TourWelcomeCard({ news, onStart, onDismiss }: { news: boolean; onStart: () => void; onDismiss: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Foco no cartão (sem rolar a página), para o leitor de tela anunciar o título
    ref.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-labelledby="tour-boas-vindas-titulo"
      aria-describedby="tour-boas-vindas-texto"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onDismiss();
        }
      }}
      className="fixed inset-x-4 bottom-[calc(88px+env(safe-area-inset-bottom))] z-[60] flex flex-col gap-4 rounded-2xl border border-linha bg-papel p-5 text-tinta shadow-[var(--shadow-aceito-2)] outline-none motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 md:inset-x-auto md:bottom-6 md:right-6 md:w-[400px] md:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ameixa-suave text-ameixa" aria-hidden="true">
          <Compass className="size-5" strokeWidth={1.6} />
        </span>
        <div className="flex min-w-0 flex-col gap-1.5">
          <h2 id="tour-boas-vindas-titulo" className="font-display text-[24px] font-medium leading-8 text-tinta">
            {news ? "Tem novidade no painel." : "Vamos preparar o casamento de vocês."}
          </h2>
          <p id="tour-boas-vindas-texto" className="text-base leading-6 text-tinta-suave">
            {news
              ? "Mostramos só o que mudou desde a última vez que vocês viram o passo a passo."
              : "Em poucos passos, mostramos onde fica cada coisa no painel: convidados, site, presentes e o que mais vocês puderem usar."}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button onClick={onStart} className="sm:flex-1">
          {news ? "Ver as novidades" : "Ver o passo a passo"}
        </Button>
        <Button variant="outline" onClick={onDismiss} className="sm:flex-1">
          Agora não
        </Button>
      </div>
      <p className="text-sm leading-5 text-tinta-suave">Para rever depois, abram o menu da conta ou as Configurações.</p>
    </div>
  );
}
