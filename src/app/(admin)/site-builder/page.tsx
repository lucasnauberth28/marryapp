import {
  getSiteCustomization,
  getStoryItems,
  getWeddingTips,
} from "@/actions/site-builder-actions";
import { getSettings } from "@/actions/settings-actions";
import { requireWeddingPage } from "@/lib/security/wedding-context";
import { getFeaturedGifts } from "@/lib/wedding-data";
import { SiteBuilderClient } from "./site-builder-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Site do casal",
  description: "Edite os textos, fotos e seções do site do casamento.",
};

export default async function SiteBuilderPage() {
  const { weddingId, wedding } = await requireWeddingPage("/site-builder");
  const [settings, storyItems, tips, previewGifts, rules] = await Promise.all([
    getSiteCustomization(),
    getStoryItems(),
    getWeddingTips(),
    getFeaturedGifts(weddingId),
    getSettings(),
  ]);

  return (
    <SiteBuilderClient
      initialSettings={settings}
      initialStoryItems={storyItems}
      initialTips={tips}
      previewGifts={previewGifts}
      rsvpDeadline={rules.rsvpDeadline}
      slug={wedding.slug}
    />
  );
}
