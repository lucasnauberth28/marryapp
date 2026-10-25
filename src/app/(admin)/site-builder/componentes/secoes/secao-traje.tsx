import { Plus, Trash2 } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { Entrada } from "@/components/ui/input";
import { AreaDeTexto } from "@/components/ui/textarea";
import { InterruptorDeVisibilidade } from "../interruptor-de-visibilidade";
import type { ChaveDaConfiguracao } from "../tipos";
import type { EditorDoSite } from "../use-configuracoes-do-site";
import { interpretarPaleta } from "../utilitarios";

const MAXIMO_DE_CORES = 6;

function PaletaDeCores({ site }: { site: EditorDoSite }) {
  const paleta = interpretarPaleta(site.configuracoes.dressCodePalette);
  const guardar = (cores: string[]) => site.atualizar({ dressCodePalette: JSON.stringify(cores) });
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-semibold text-tinta">Cores sugeridas</legend>
      <div className="flex flex-wrap items-center gap-3">
        {paleta.map((cor, i) => (
          <div key={i} className="flex items-center gap-1">
            <input
              type="color"
              value={cor}
              aria-label={`Cor ${i + 1}`}
              onChange={(e) => guardar(paleta.map((c, j) => (j === i ? e.target.value : c)))}
              className="size-11 cursor-pointer rounded-full border border-linha-forte bg-papel p-0.5"
            />
            <button
              type="button"
              aria-label={`Remover cor ${i + 1}`}
              onClick={() => guardar(paleta.filter((_, j) => j !== i))}
              className="grid size-11 place-items-center rounded-full text-tinta-suave hover:bg-perigo-suave hover:text-perigo"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </div>
        ))}
        {paleta.length < MAXIMO_DE_CORES && (
          <button type="button" className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm}`} onClick={() => guardar([...paleta, "#C5A880"])}>
            <Plus className="size-4" aria-hidden="true" /> Adicionar cor
          </button>
        )}
      </div>
    </fieldset>
  );
}

export function SecaoDoTraje({ chave, descricao, site }: { chave: ChaveDaConfiguracao; descricao?: string; site: EditorDoSite }) {
  const { configuracoes, atualizar } = site;
  return (
    <>
      <InterruptorDeVisibilidade chave={chave} descricao={descricao} site={site} />
      <Entrada id="dressCodeTitle" label="Tipo de traje" value={configuracoes.dressCodeTitle || ""} onChange={(e) => atualizar({ dressCodeTitle: e.target.value })} placeholder="Passeio completo" />
      <AreaDeTexto id="dressCodeDesc" label="Orientações" rows={3} value={configuracoes.dressCodeDesc || ""} onChange={(e) => atualizar({ dressCodeDesc: e.target.value })} />
      <PaletaDeCores site={site} />
    </>
  );
}
