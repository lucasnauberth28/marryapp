import { useId } from "react";
import { Check } from "lucide-react";
import { RodapeDoFormularioDeAcesso } from "@/components/casal/acesso/rodape-do-formulario";
import { estiloDoCartao, estiloDoTituloDoCartao } from "@/components/casal/ui";
import { Entrada } from "@/components/ui/input";
import { MODULOS_DISPONIVEIS } from "./tipos";
import type { GestaoDePerfis } from "./use-perfis";

function AreaLiberada({ id, nome, marcada, aoAlternar }: { id: string; nome: string; marcada: boolean; aoAlternar: (id: string) => void }) {
  return (
    <button
      type="button"
      aria-pressed={marcada}
      onClick={() => aoAlternar(id)}
      className={`flex min-h-12 items-center justify-between gap-2 rounded-xl border p-3 text-left transition-colors ${
        marcada ? "border-ameixa bg-ameixa text-on-ameixa" : "border-linha-forte bg-papel text-tinta hover:border-ameixa hover:bg-ameixa-suave"
      }`}
    >
      <span className="text-[15px] font-medium">{nome}</span>
      {marcada && <Check className="size-4 shrink-0" aria-hidden="true" />}
    </button>
  );
}

export function FormularioDoPerfil({ g }: { g: GestaoDePerfis }) {
  const uid = useId();
  return (
    <section aria-labelledby={`${uid}-titulo`} className={`${estiloDoCartao} flex flex-col gap-6 p-5 sm:p-6`}>
      <div>
        <h2 id={`${uid}-titulo`} className={estiloDoTituloDoCartao}>{g.editing ? "Editar perfil" : "Novo perfil"}</h2>
        <p className="mt-0.5 text-[15px] text-tinta-suave">Dê um nome ao perfil e marque as áreas que ele pode abrir.</p>
      </div>
      <Entrada id={`${uid}-name`} label="Nome do perfil" fieldClassName="max-w-md" placeholder="Ex.: Cerimonialista, Financeiro" value={g.formData.name} onChange={(e) => g.mudarNome(e.target.value)} />
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold text-tinta">Áreas liberadas</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {MODULOS_DISPONIVEIS.map((mod) => (
            <AreaLiberada key={mod.id} id={mod.id} nome={mod.name} marcada={g.formData.allowedPaths.includes(mod.id)} aoAlternar={g.alternar} />
          ))}
        </div>
      </fieldset>
      <RodapeDoFormularioDeAcesso pendente={g.isPending} rotuloDeSalvar="Salvar perfil" aoCancelar={g.fecharFormulario} aoSalvar={g.salvar} />
    </section>
  );
}
