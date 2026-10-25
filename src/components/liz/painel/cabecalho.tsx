import { RotateCcw, X } from "lucide-react";
import { AvatarDaLiz } from "../liz-illustration";

const BOTAO_REDONDO = "grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl text-tinta-suave hover:bg-areia";

export function CabecalhoDaLiz({ titleId, podeRecomecar, onRestart, onClose }: { titleId: string; podeRecomecar: boolean; onRestart: () => void; onClose: () => void }) {
  return (
    <header className="flex items-center gap-3 border-b border-linha px-4 py-3">
      <AvatarDaLiz size={44} decorative className="ring-1 ring-linha" />
      <div className="min-w-0 flex-1">
        <h2 id={titleId} className="font-display text-xl font-medium leading-6 text-tinta">
          Liz, sua assistente
        </h2>
        <p className="text-sm leading-5 text-tinta-suave">Assuntos prontos ou a sua dúvida</p>
      </div>
      {podeRecomecar ? (
        <button type="button" onClick={onRestart} aria-label="Recomeçar a conversa" title="Recomeçar a conversa" className={BOTAO_REDONDO}>
          <RotateCcw className="size-[18px]" aria-hidden="true" />
        </button>
      ) : null}
      <button type="button" onClick={onClose} aria-label="Fechar a Liz" className={BOTAO_REDONDO}>
        <X className="size-5" aria-hidden="true" />
      </button>
    </header>
  );
}
