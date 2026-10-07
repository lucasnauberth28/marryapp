import {
  getSiteCustomization,
  getStoryItems,
  getWeddingTips,
  getGuestBookEntries,
} from "@/actions/site-builder-actions";
import prisma from "@/lib/prisma";
import { guestPageMetadata } from "@/lib/wedding";
import { WeddingSiteView } from "@/components/public/wedding-site-view";
import { getSettings } from "@/actions/settings-actions";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return guestPageMetadata(null);
}

export default async function WeddingPublicPage() {
  const [settings, storyItems, tips, guestbookEntries, gifts, rules] = await Promise.all([
    getSiteCustomization(),
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
