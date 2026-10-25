import { SiteUnavailable } from "@/components/public/site-unavailable";
import { WeddingSiteView } from "@/components/public/wedding-site-view";
import { metadadosDaPaginaDoConvidado } from "@/lib/wedding";
import { obterDadosDoSitePublico } from "@/lib/wedding-data";
import { exigirCasamentoPublico } from "@/lib/wedding-redirect";

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
  if (wedding.suspendedAt) return <SiteUnavailable />;
  const { settings, storyItems, tips, guestbookEntries, gifts, rsvpDeadline } = await obterDadosDoSitePublico(wedding);

  return (
    <WeddingSiteView
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
