import { PageHeader } from "@/components/plataforma/page-header";
import { ScreenInProgress } from "@/components/plataforma/screen-in-progress";
import { requirePlatformAdminPage } from "@/lib/security/platform-admin";

export const metadata = { title: "Saúde do sistema" };

export default async function Page() {
  await requirePlatformAdminPage(); // guard da página (o layout sozinho não basta)
  return (
    <>
      <PageHeader eyebrow="Sistema" title="Saúde do sistema" description="O que faz o Aceito funcionar, num lugar só." />
      <ScreenInProgress />
    </>
  );
}
