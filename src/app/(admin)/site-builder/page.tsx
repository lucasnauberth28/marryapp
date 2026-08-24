import {
  getSiteCustomization,
  getStoryItems,
  getWeddingTips,
} from "@/actions/site-builder-actions";
import { SiteBuilderClient } from "./site-builder-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Construtor do Site dos Noivos | MarryApp",
  description: "Personalize todas as seções e blocos do site do casamento.",
};

export default async function SiteBuilderPage() {
  const [settings, storyItems, tips] = await Promise.all([
    getSiteCustomization(),
    getStoryItems(),
    getWeddingTips(),
  ]);

  return (
    <SiteBuilderClient
      initialSettings={settings}
      initialStoryItems={storyItems}
      initialTips={tips}
    />
  );
}
