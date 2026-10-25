import { InterruptorDeVisibilidade } from "./interruptor-de-visibilidade";
import { SeletorDeModelo } from "./seletor-de-modelo";
import { SecaoDaGaleria } from "./secoes/secao-galeria";
import { SecaoCapa } from "./secoes/secao-capa";
import { SecaoDasDicas } from "./secoes/secao-dicas";
import { SecaoDaHistoria } from "./secoes/secao-historia";
import { SecaoDoLocal } from "./secoes/secao-local";
import { SecaoDaMusica } from "./secoes/secao-musica";
import { SecaoDoTraje } from "./secoes/secao-traje";
import type { ChaveDaConfiguracao, IdDaSecao, ItemParaExcluir } from "./tipos";
import type { EditorDoSite, EnvioDeFoto } from "./use-configuracoes-do-site";
import type { useGaleria } from "./use-galeria";
import type { useDicas, useHistoria } from "./use-historia-e-dicas";

interface PropriedadesDoConteudoDaSecao {
  id: IdDaSecao;
  chave?: ChaveDaConfiguracao;
  descricao?: string;
  site: EditorDoSite;
  foto: EnvioDeFoto;
  historia: ReturnType<typeof useHistoria>;
  dicas: ReturnType<typeof useDicas>;
  galeria: ReturnType<typeof useGaleria>;
  ocupado: boolean;
  pedirExclusao: (item: ItemParaExcluir) => void;
}

/** Os campos de cada seção do site. */
export function ConteudoDaSecao({ id, chave, descricao, site, foto, historia, dicas, galeria, ocupado, pedirExclusao }: PropriedadesDoConteudoDaSecao) {
  if (id === "TEMPLATE") return <SeletorDeModelo site={site} />;
  if (id === "COVER") return <SecaoCapa site={site} foto={foto} />;
  if (!chave) return null;
  if (id === "STORY") return <SecaoDaHistoria chave={chave} descricao={descricao} site={site} foto={foto} historia={historia} ocupado={ocupado} pedirExclusao={pedirExclusao} />;
  if (id === "GALLERY") return <SecaoDaGaleria chave={chave} descricao={descricao} site={site} galeria={galeria} />;
  if (id === "LOCATION") return <SecaoDoLocal chave={chave} site={site} />;
  if (id === "DRESS") return <SecaoDoTraje chave={chave} descricao={descricao} site={site} />;
  if (id === "TIPS") return <SecaoDasDicas chave={chave} descricao={descricao} site={site} dicas={dicas} ocupado={ocupado} pedirExclusao={pedirExclusao} />;
  if (id === "MUSIC") return <SecaoDaMusica chave={chave} descricao={descricao} site={site} />;
  return <InterruptorDeVisibilidade chave={chave} descricao={descricao} site={site} />;
}
