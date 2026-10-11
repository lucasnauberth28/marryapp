import { PageHeader } from "@/components/plataforma/page-header";
import { ScreenInProgress } from "@/components/plataforma/screen-in-progress";
import { requirePlatformAdminPage } from "@/lib/security/platform-admin";

export const metadata = { title: "Planos e receita" };

export default async function Page() {
  await requirePlatformAdminPage(); // guard da página (o layout sozinho não basta)
  return (
    <>
      <PageHeader eyebrow="Dinheiro" title="Planos e receita" description="Casais pagam uma vez. Fornecedores pagam por mês." />
      <ScreenInProgress />
    </>
  );
}
