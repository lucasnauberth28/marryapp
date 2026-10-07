import {
  getSiteCustomization,
  getStoryItems,
  getWeddingTips,
} from "@/actions/site-builder-actions";
import { getSettings } from "@/actions/settings-actions";
import prisma from "@/lib/prisma";
import { SiteBuilderClient } from "./site-builder-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Site do casal",
  description: "Edite os textos, fotos e seções do site do casamento.",
};

export default async function SiteBuilderPage() {
  const [settings, storyItems, tips, previewGifts, rules] = await Promise.all([
    getSiteCustomization(),
    getStoryItems(),
    getWeddingTips(),
    prisma.gift.findMany({
      where: { isPurchased: false },
      select: { id: true, title: true, description: true, amount: true, imageUrl: true },
      take: 6,
    }),
    getSettings(),
  ]);

  return (
    <SiteBuilderClient
      initialSettings={settings}
      initialStoryItems={storyItems}
      initialTips={tips}
      previewGifts={previewGifts}
      rsvpDeadline={rules.rsvpDeadline}
    />
  );
}
