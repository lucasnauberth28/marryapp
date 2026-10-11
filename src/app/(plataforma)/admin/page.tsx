import { PageHeader } from "@/components/plataforma/page-header";
import { ScreenInProgress } from "@/components/plataforma/screen-in-progress";
import { requirePlatformAdminPage } from "@/lib/security/platform-admin";
import { formatLongDate } from "@/lib/platform/format";
import { greetingForHour } from "@/lib/wedding-format";

export const metadata = { title: "Visão geral" };

export default async function Page() {
  const admin = await requirePlatformAdminPage(); // guard da página (o layout sozinho não basta)
  const now = new Date();
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "America/Sao_Paulo" }).format(now)) % 24;
  return (
    <>
      <PageHeader
        eyebrow={formatLongDate(now)}
        title={admin.firstName ? `${greetingForHour(hour)}, ${admin.firstName}` : greetingForHour(hour)}
        description="O que pede a sua decisão hoje e como a plataforma está indo."
      />
      <ScreenInProgress />
    </>
  );
}
