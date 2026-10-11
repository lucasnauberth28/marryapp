import { PageHeader } from "@/components/plataforma/page-header";
import { ScreenInProgress } from "@/components/plataforma/screen-in-progress";
import { requirePlatformAdminPage } from "@/lib/security/platform-admin";

export const metadata = { title: "Fornecedores" };

export default async function Page() {
  await requirePlatformAdminPage(); // guard da página (o layout sozinho não basta)
  return (
    <>
      <PageHeader eyebrow="Casais e fornecedores" title="Fornecedores" description="Perfis do marketplace, planos e avaliações." />
      <ScreenInProgress />
    </>
  );
}
