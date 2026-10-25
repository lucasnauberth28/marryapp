import { X } from "lucide-react";
import { AvatarDaLiz } from "../liz-illustration";

interface Propriedades {
  fabRef: React.RefObject<HTMLButtonElement | null>;
  open: boolean;
  hidden: boolean;
  panelId: string;
  onClick: () => void;
}

/** O botão flutuante: redondo no celular, pílula com o rosto e o nome no computador. */
export function BotaoDaLiz({ fabRef, open, hidden, panelId, onClick }: Propriedades) {
  return (
    <button
      ref={fabRef}
      type="button"
      data-tour="liz"
      aria-label="Falar com a Liz"
      title="Falar com a Liz"
      aria-expanded={open}
      aria-controls={panelId}
      aria-haspopup="dialog"
      hidden={hidden}
      onClick={onClick}
      className={`liz-fab flex size-14 cursor-pointer items-center justify-center gap-2 rounded-full shadow-[var(--shadow-aceito-2)] transition-[background-color,transform] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ameixa md:size-auto md:h-[52px] md:justify-start md:border md:border-linha md:p-1.5 md:pr-4 md:shadow-[var(--shadow-aceito-1)] ${
        open ? "bg-ameixa text-on-ameixa hover:bg-ameixa-hover md:border-ameixa" : "bg-papel text-tinta ring-2 ring-ameixa motion-safe:hover:scale-105 md:ring-0 md:hover:border-linha-forte md:motion-safe:hover:scale-100"
      }`}
    >
      {/* Fechado: o rosto da Liz (o nome acessível vem do botão); aberto: o X para fechar */}
      {open ? (
        <span className="grid size-10 place-items-center">
          <X className="size-6" aria-hidden="true" />
        </span>
      ) : (
        <AvatarDaLiz size={40} decorative className="max-md:size-[52px]!" />
      )}
      <span className="hidden text-sm font-semibold md:inline" aria-hidden="true">
        Falar com a Liz
      </span>
    </button>
  );
}
