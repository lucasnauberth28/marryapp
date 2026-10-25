import { Link2 } from "lucide-react";
import { Entrada } from "@/components/ui/input";
import { BOTAO_SECUNDARIO, copiarTexto } from "./tipos";

export function CaixaDoLink({ url }: { url: string }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <Entrada id="proposta-link" label="Link da proposta para o casal" readOnly value={url} onFocus={(e) => e.currentTarget.select()} fieldClassName="flex-1" inputClassName="text-sm" />
      <button type="button" onClick={() => void copiarTexto(url, "Link da proposta copiado.")} className={BOTAO_SECUNDARIO}>
        <Link2 aria-hidden="true" className="size-[18px]" />
        Copiar link
      </button>
    </div>
  );
}
