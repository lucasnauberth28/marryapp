import { Eye, EyeOff } from "lucide-react";
import { Interruptor } from "@/components/ui/switch";
import type { ChaveDaConfiguracao } from "./tipos";
import type { EditorDoSite } from "./use-configuracoes-do-site";

/** Interruptor de "aparece no site" (publicado na hora, como antes). */
export function InterruptorDeVisibilidade({ chave, descricao, site }: { chave: ChaveDaConfiguracao; descricao?: string; site: EditorDoSite }) {
  const visivel = site.configuracoes[chave] !== false;
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-linho px-3 py-2">
      <div className="min-w-0">
        <label htmlFor={`block-${chave}`} className="flex min-h-6 items-center gap-1.5 text-sm font-semibold text-tinta">
          {visivel ? <Eye className="size-4" aria-hidden="true" /> : <EyeOff className="size-4" aria-hidden="true" />}
          Mostrar no site
        </label>
        {descricao && <p className="text-sm text-tinta-suave">{descricao}</p>}
      </div>
      <Interruptor id={`block-${chave}`} checked={visivel} onCheckedChange={(marcada) => site.alternarSecao(chave, marcada)} />
    </div>
  );
}
