import {
  getSiteCustomization,
  getStoryItems,
  getWeddingTips,
  getGuestBookEntries,
} from "@/actions/site-builder-actions";
import prisma from "@/lib/prisma";
import { WeddingSiteView } from "@/components/public/wedding-site-view";
import { getSettings } from "@/actions/settings-actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const settings = await prisma.siteCustomization.findFirst({
    where: { slug },
  });

  return {
    title: { absolute: settings?.title || "Casamento" },
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

  const [storyItems, tips, guestbookEntries, gifts, rules] = await Promise.all([
    getStoryItems(),
    getWeddingTips(),
    getGuestBookEntries(),
    prisma.gift
      .findMany({
        where: { isPurchased: false },
        select: { id: true, title: true, description: true, amount: true, imageUrl: true },
        take: 6,
      })
      .catch(() => []),
    getSettings().catch(() => null),
  ]);

  return (
    <WeddingSiteView
      settings={settings}
      storyItems={storyItems}
      tips={tips}
      guestbookEntries={guestbookEntries}
      gifts={gifts}
      rsvpDeadline={rules?.rsvpDeadline ?? null}
    />
  );
}
