import { WeddingSiteView } from "@/components/public/wedding-site-view";
import { guestPageMetadata } from "@/lib/wedding";
import { getPublicSiteData } from "@/lib/wedding-data";
import { requirePublicWedding } from "@/lib/wedding-redirect";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return guestPageMetadata(slug, null);
}

export default async function WeddingPublicSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const wedding = await requirePublicWedding(slug);
  const { settings, storyItems, tips, guestbookEntries, gifts, rsvpDeadline } = await getPublicSiteData(wedding);

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
