import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RespostaPronta } from "./tipos";

interface Propriedades {
  uid: string;
  replies: RespostaPronta[];
  repliesRef: React.RefObject<HTMLDivElement | null>;
  text: string;
  setText: (t: string) => void;
  asking: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function RodapeDaLiz({ uid, replies, repliesRef, text, setText, asking, onSubmit }: Propriedades) {
  return (
    <div className="flex flex-col gap-2.5 border-t border-linha px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3">
      <div ref={repliesRef} tabIndex={-1} role="group" aria-label="Respostas" aria-describedby={`${uid}-r`} className="flex max-h-[40dvh] flex-wrap gap-2 overflow-y-auto outline-none md:max-h-56">
        <span id={`${uid}-r`} className="sr-only">
          Escolham uma resposta ou escrevam a dúvida
        </span>
        {replies.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={r.onPick}
            className={cn(
              "min-h-11 cursor-pointer rounded-full border px-4 py-2 text-left text-[15px] font-semibold leading-5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ameixa",
              r.primary ? "border-ameixa bg-ameixa text-on-ameixa hover:bg-ameixa-hover" : "border-ameixa/40 bg-papel text-ameixa hover:border-ameixa hover:bg-ameixa-suave",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
      <form onSubmit={onSubmit} role="search" className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Escrevam a dúvida sobre o painel"
          placeholder="Ou escrevam a dúvida"
          autoComplete="off"
          enterKeyHint="send"
          className="min-h-11 min-w-0 flex-1 rounded-full border border-linha-forte bg-papel px-4 text-base text-tinta placeholder:text-tinta-suave"
        />
        <button type="submit" aria-label="Enviar a dúvida" disabled={!text.trim() || asking} className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-ameixa text-on-ameixa transition-colors hover:bg-ameixa-hover disabled:cursor-not-allowed disabled:opacity-50">
          <Send className="size-[18px]" aria-hidden="true" />
        </button>
      </form>
      <p className="text-xs leading-4 text-tinta-suave">A Liz sugere o próximo passo e responde dúvidas do guia. Vocês escolhem o que fazer.</p>
    </div>
  );
}
