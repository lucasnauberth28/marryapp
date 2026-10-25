import type { DadosDoSite, PropriedadesDeLink } from "../../dados-do-site";
import type { DicaDoSite, ItemDaHistoria, PresenteDoSite, RecadoDoLivro } from "../../tipos";

/** O que cada modelo recebe para montar a página dele. */
export interface PropriedadesDoLayout {
  slug: string;
  site: DadosDoSite;
  linkProps: PropriedadesDeLink;
  historia: ItemDaHistoria[];
  dicas: DicaDoSite[];
  presentes: PresenteDoSite[];
  recados: RecadoDoLivro[];
  preview: boolean;
}
