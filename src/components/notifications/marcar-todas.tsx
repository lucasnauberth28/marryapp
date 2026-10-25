import { CheckCheck } from "lucide-react";

/** Fica na tela (desligado) depois de marcar tudo: o foco do teclado não se perde. */
export function BotaoMarcarTodas({ desligado, aoClicar }: { desligado: boolean; aoClicar: () => void }) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      disabled={desligado}
      className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-ameixa transition-colors hover:bg-ameixa-suave focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ameixa disabled:cursor-default disabled:text-tinta-suave disabled:hover:bg-transparent"
    >
      <CheckCheck aria-hidden="true" className="size-4" />
      Marcar todas como lidas
    </button>
  );
}
