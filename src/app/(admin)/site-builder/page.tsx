import { obterPersonalizacaoDoSite } from "@/actions/site/personalizacao";
import { obterItensDaHistoria } from "@/actions/site/historia";
import { obterDicasParaEdicao } from "@/actions/site/dicas";
import { obterConfiguracoes } from "@/actions/settings-actions";
import { exigirCasamentoNaPagina } from "@/lib/security/wedding-context";
import { obterPresentesEmDestaque } from "@/lib/wedding-data";
import { EditorDoSiteCliente } from "./editor-do-site-cliente";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Editar o site",
  description: "Edite os textos, fotos e seções do site do casamento.",
};

export default async function SiteBuilderPage() {
  const { weddingId, wedding } = await exigirCasamentoNaPagina("/site-builder");
  const [settings, storyItems, tips, previewGifts, rules] = await Promise.all([
    obterPersonalizacaoDoSite(),
    obterItensDaHistoria(),
    obterDicasParaEdicao(),
    obterPresentesEmDestaque(weddingId),
    obterConfiguracoes(),
  ]);

  return (
    <EditorDoSiteCliente
      initialSettings={settings}
      initialStoryItems={storyItems}
      initialTips={tips}
      previewGifts={previewGifts}
      rsvpDeadline={rules.rsvpDeadline}
      slug={wedding.slug}
      customDomain={wedding.customDomain ?? null}
    />
  );
}
