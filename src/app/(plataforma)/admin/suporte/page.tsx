import { PageHeader } from "@/components/plataforma/page-header";
import { ScreenInProgress } from "@/components/plataforma/screen-in-progress";
import { requirePlatformAdminPage } from "@/lib/security/platform-admin";

export const metadata = { title: "Suporte e LGPD" };

export default async function Page() {
  await requirePlatformAdminPage(); // guard da página (o layout sozinho não basta)
  return (
    <>
      <PageHeader eyebrow="Suporte" title="Suporte e LGPD" description="Ajude casais e fornecedores e responda aos pedidos sobre dados pessoais dentro do prazo." />
      <ScreenInProgress />
    </>
  );
}
