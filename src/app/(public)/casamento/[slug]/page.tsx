import { SiteIndisponivel } from "@/components/public/site-unavailable";
import { VisaoDoSiteDoCasamento } from "@/components/public/site-do-casamento/visao-do-site";
import { metadadosDaPaginaDoConvidado } from "@/lib/casamento/wedding";
import { obterDadosDoSitePublico } from "@/lib/casamento/wedding-data";
import { exigirCasamentoPublico } from "@/lib/casamento/wedding-redirect";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return metadadosDaPaginaDoConvidado(slug, null);
}

export default async function WeddingPublicSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const wedding = await exigirCasamentoPublico(slug);
  if (wedding.suspendedAt) return <SiteIndisponivel />;
  const { settings, storyItems, tips, guestbookEntries, gifts, rsvpDeadline } = await obterDadosDoSitePublico(wedding);

  return (
    <VisaoDoSiteDoCasamento
      slug={wedding.slug}
      settings={settings}
      storyItems={storyItems}
      tips={tips}
      guestbookEntries={guestbookEntries}
      gifts={gifts}
      rsvpDeadline={rsvpDeadline}
    />
  );
}
