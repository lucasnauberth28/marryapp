import { PageHeader } from "@/components/plataforma/page-header";
import { ScreenInProgress } from "@/components/plataforma/screen-in-progress";
import { requirePlatformAdminPage } from "@/lib/security/platform-admin";

export const metadata = { title: "Casais" };

export default async function Page() {
  await requirePlatformAdminPage(); // guard da página (o layout sozinho não basta)
  return (
    <>
      <PageHeader eyebrow="Casais e fornecedores" title="Casais" description="Todos os casamentos do Aceito, com plano, convidados e última atividade." />
      <ScreenInProgress />
    </>
  );
}
