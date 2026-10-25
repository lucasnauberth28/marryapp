// Capa do site: cada modelo escolhe um desenho (arco central, dividida ou tela cheia); os dados e os botões são os mesmos.
import type { DadosDoSite, PropriedadesDeLink } from "./dados-do-site";
import { CapaArcoCentral } from "./capas/capa-arco-central";
import { CapaDividida } from "./capas/capa-dividida";
import { CapaTelaCheia } from "./capas/capa-tela-cheia";

export function CapaDoSite({ site, linkProps }: { site: DadosDoSite; linkProps: PropriedadesDeLink }) {
  if (site.modelo.capa === "dividida") return <CapaDividida site={site} linkProps={linkProps} />;
  if (site.modelo.capa === "tela-cheia") return <CapaTelaCheia site={site} linkProps={linkProps} />;
  return <CapaArcoCentral site={site} linkProps={linkProps} />;
}
