import { Plus } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { BotaoComCarregamento } from "@/components/painel/loading-button";
import { Entrada } from "@/components/ui/input";
import { AreaDeTexto } from "@/components/ui/textarea";
import { CampoDeFoto } from "../campo-de-foto";
import { InterruptorDeVisibilidade } from "../interruptor-de-visibilidade";
import { ListaDeItens } from "../lista-de-itens";
import type { ChaveDaConfiguracao, ItemParaExcluir } from "../tipos";
import type { EditorDoSite, EnvioDeFoto } from "../use-configuracoes-do-site";
import type { useHistoria } from "../use-historia-e-dicas";

interface PropriedadesDaSecaoDaHistoria {
  chave: ChaveDaConfiguracao;
  descricao?: string;
  site: EditorDoSite;
  foto: EnvioDeFoto;
  historia: ReturnType<typeof useHistoria>;
  ocupado: boolean;
  pedirExclusao: (item: ItemParaExcluir) => void;
}

function NovoMomento({ historia, ocupado }: Pick<PropriedadesDaSecaoDaHistoria, "historia" | "ocupado">) {
  const { novo, setNovo } = historia;
  return (
    <fieldset className="flex flex-col gap-5 rounded-xl border border-linha p-3 pt-4">
      <legend className="px-1 text-sm font-semibold text-tinta">Novo momento</legend>
      <Entrada id="story-title" label="Título" value={novo.title} onChange={(e) => setNovo({ ...novo, title: e.target.value })} placeholder="O primeiro encontro" />
      <Entrada id="story-date" label="Quando" value={novo.dateLabel} onChange={(e) => setNovo({ ...novo, dateLabel: e.target.value })} placeholder="Outubro de 2021" />
      <AreaDeTexto id="story-desc" label="O que aconteceu" rows={3} value={novo.description} onChange={(e) => setNovo({ ...novo, description: e.target.value })} />
      <BotaoComCarregamento onClick={historia.adicionar} loading={historia.adicionando} disabled={ocupado} className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm} w-fit`}>
        <Plus className="size-4" aria-hidden="true" /> Adicionar momento
      </BotaoComCarregamento>
    </fieldset>
  );
}

export function SecaoDaHistoria({ chave, descricao, site, foto, historia, ocupado, pedirExclusao }: PropriedadesDaSecaoDaHistoria) {
  const { configuracoes, atualizar } = site;
  return (
    <>
      <InterruptorDeVisibilidade chave={chave} descricao={descricao} site={site} />
      <AreaDeTexto id="welcomeMessage" label="Mensagem de boas-vindas" rows={3} value={configuracoes.welcomeMessage || ""} onChange={(e) => atualizar({ welcomeMessage: e.target.value })} />
      <CampoDeFoto campo="couplePhotoUrl" label="Foto do casal" hint="Aparece na seção “Nossa história”." site={site} foto={foto} />
      <NovoMomento historia={historia} ocupado={ocupado} />
      <ListaDeItens
        title={`Momentos publicados (${historia.itens.length})`}
        empty="Nenhum momento ainda. A seção mostra só a mensagem e a foto do casal."
        items={historia.itens.map((i) => ({ id: i.id, eyebrow: i.dateLabel, title: i.title, text: i.description }))}
        onDelete={(item) => pedirExclusao({ tipo: "story", id: item.id, title: item.title })}
      />
    </>
  );
}
