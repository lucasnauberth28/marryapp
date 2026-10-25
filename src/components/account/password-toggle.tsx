import { Eye, EyeOff } from "lucide-react";

/** Botão de olho dos campos de senha. `varias` muda o rótulo para telas com mais de uma senha ("Mostrar senhas"). */
export function AlternarVisibilidadeDaSenha({ show, onToggle, varias = false }: { show: boolean; onToggle: () => void; varias?: boolean }) {
  const alvo = varias ? "senhas" : "senha";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? `Ocultar ${alvo}` : `Mostrar ${alvo}`}
      aria-pressed={show}
      className="grid size-11 cursor-pointer place-items-center rounded-[10px] text-tinta-suave transition-colors hover:bg-areia hover:text-tinta"
    >
      {show ? <EyeOff aria-hidden="true" className="size-[18px]" strokeWidth={1.6} /> : <Eye aria-hidden="true" className="size-[18px]" strokeWidth={1.6} />}
    </button>
  );
}
