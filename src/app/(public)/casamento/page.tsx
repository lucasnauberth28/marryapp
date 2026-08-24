import {
  getSiteCustomization,
  getStoryItems,
  getWeddingTips,
  getGuestBookEntries,
} from "@/actions/site-builder-actions";
import prisma from "@/lib/prisma";
import { WeddingSiteView } from "@/components/public/wedding-site-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lucas & Giovanna — Casamento 11 de Outubro de 2027",
  description: "Celebre conosco este momento especial. Informações do local, traje, lista de presentes e confirmação de presença.",
};

export default async function WeddingPublicPage() {
  const [settings, storyItems, tips, guestbookEntries, gifts] = await Promise.all([
    getSiteCustomization(),
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
