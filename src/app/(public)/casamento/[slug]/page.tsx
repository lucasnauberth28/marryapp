import {
  getSiteCustomization,
  getStoryItems,
  getWeddingTips,
  getGuestBookEntries,
} from "@/actions/site-builder-actions";
import prisma from "@/lib/prisma";
import { WeddingSiteView } from "@/components/public/wedding-site-view";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const settings = await prisma.siteCustomization.findFirst({
    where: { slug },
  });

  return {
    title: `${settings?.title || "Casamento"} | MarryApp`,
    description: "Celebre conosco este momento especial. Informações do local, traje, lista de presentes e confirmação de presença.",
  };
}

export default async function WeddingPublicSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let settings = await prisma.siteCustomization.findFirst({
    where: { slug },
  });

  if (!settings) {
    settings = await getSiteCustomization();
  }

  const [storyItems, tips, guestbookEntries, gifts] = await Promise.all([
    getStoryItems(),
    getWeddingTips(),
    getGuestBookEntries(),
    prisma.gift.findMany({ where: { isPurchased: false }, take: 6 }).catch(() => []),
  ]);

  return (
    <WeddingSiteView
      settings={settings}
      storyItems={storyItems}
      tips={tips}
      guestbookEntries={guestbookEntries}
      gifts={gifts}
    />
  );
}
