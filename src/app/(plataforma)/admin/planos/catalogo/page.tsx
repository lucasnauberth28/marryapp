import { PageHeader } from "@/components/plataforma/page-header";
import { ScreenInProgress } from "@/components/plataforma/screen-in-progress";
import { requirePlatformAdminPage } from "@/lib/security/platform-admin";

export const metadata = { title: "Catálogo e preços" };

export default async function Page() {
  await requirePlatformAdminPage(); // guard da página (o layout sozinho não basta)
  return (
    <>
      <PageHeader eyebrow="Dinheiro" title="Catálogo e preços" description="O que cada plano custa e o que cada pagamento rende. Editar um preço não muda o que já foi pago." />
      <ScreenInProgress />
    </>
  );
}
