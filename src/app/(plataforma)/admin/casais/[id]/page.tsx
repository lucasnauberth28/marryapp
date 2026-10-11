import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/plataforma/page-header";
import { ScreenInProgress } from "@/components/plataforma/screen-in-progress";
import { requirePlatformAdminPage } from "@/lib/security/platform-admin";

export const metadata = { title: "Casal" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requirePlatformAdminPage(); // guard da página (o layout sozinho não basta)
  const { id } = await params;
  // O id vem da URL: só serve para BUSCAR o casamento (nunca para decidir permissão). Formato inválido = 404.
  if (!z.string().uuid().safeParse(id).success) notFound();
  return (
    <>
      <PageHeader breadcrumb={[{ label: "Casais", href: "/admin/casais" }, { label: "Casal" }]} eyebrow="Casal" title="Casal" />
      <ScreenInProgress />
    </>
  );
}
