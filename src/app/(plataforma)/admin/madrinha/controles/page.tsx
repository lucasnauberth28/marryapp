import { PageHeader } from "@/components/plataforma/page-header";
import { ScreenInProgress } from "@/components/plataforma/screen-in-progress";
import { requirePlatformAdminPage } from "@/lib/security/platform-admin";

export const metadata = { title: "Comportamento e qualidade da Madrinha" };

export default async function Page() {
  await requirePlatformAdminPage(); // guard da página (o layout sozinho não basta)
  return (
    <>
      <PageHeader eyebrow="Madrinha" title="Comportamento e qualidade" description="Como a Madrinha fala, o que ela sabe e como você confere se está ajudando." />
      <ScreenInProgress />
    </>
  );
}
