import { PageHeader } from "@/components/plataforma/page-header";
import { ScreenInProgress } from "@/components/plataforma/screen-in-progress";
import { requirePlatformAdminPage } from "@/lib/security/platform-admin";

export const metadata = { title: "Domínios" };

export default async function Page() {
  await requirePlatformAdminPage(); // guard da página (o layout sozinho não basta)
  return (
    <>
      <PageHeader eyebrow="Dinheiro" title="Domínios" description="Pedidos de domínio próprio do plano VIP. O Aceito registra o .com.br no nome da pessoa que pediu." />
      <ScreenInProgress />
    </>
  );
}
