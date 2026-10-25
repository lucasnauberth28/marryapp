// Capa do modelo Clássico (o desenho próprio do Aceito). Os outros modelos desenham a capa dentro do próprio layout (modelos/layouts).
import type { DadosDoSite, PropriedadesDeLink } from "./dados-do-site";
import { CapaArcoCentral } from "./capas/capa-arco-central";

export function CapaDoSite({ site, linkProps }: { site: DadosDoSite; linkProps: PropriedadesDeLink }) {
  return <CapaArcoCentral site={site} linkProps={linkProps} />;
}
