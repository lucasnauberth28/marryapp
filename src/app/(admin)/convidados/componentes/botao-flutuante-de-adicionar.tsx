import { Plus } from "lucide-react";

/** Botão de adicionar no celular, acima da barra inferior. */
export function BotaoFlutuanteDeAdicionar({ aoClicar }: { aoClicar: () => void }) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-label="Adicionar convidado"
      className="fixed bottom-[calc(var(--liz-fab-bottom,6rem)+56px+12px)] right-4 z-30 grid size-14 cursor-pointer place-items-center rounded-full bg-ameixa text-on-ameixa shadow-[var(--shadow-aceito-2)] transition-colors hover:bg-ameixa-hover md:hidden"
    >
      <Plus className="size-6" aria-hidden="true" />
    </button>
  );
}
