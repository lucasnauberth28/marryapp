import { PageHeader } from "@/components/plataforma/page-header";
import { ScreenInProgress } from "@/components/plataforma/screen-in-progress";
import { requirePlatformAdminPage } from "@/lib/security/platform-admin";

export const metadata = { title: "Comunicados" };

export default async function Page() {
  await requirePlatformAdminPage(); // guard da página (o layout sozinho não basta)
  return (
    <>
      <PageHeader eyebrow="Comunicação" title="Comunicados" description="Avise casais e fornecedores, ou só um grupo deles, pelo canal certo." />
      <ScreenInProgress />
    </>
  );
}
