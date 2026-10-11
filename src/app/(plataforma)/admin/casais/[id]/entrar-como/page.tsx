import { notFound } from "next/navigation";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { PageHeader } from "@/components/plataforma/page-header";
import { requirePlatformAdminPage } from "@/lib/security/platform-admin";
import { EntrarComoForm } from "./entrar-como-form";

export const metadata = { title: "Entrar como este casal" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requirePlatformAdminPage(); // guard da página (o layout sozinho não basta)
  const { id } = await params;
  // O id vem da URL: só serve para BUSCAR o casamento (nunca para decidir permissão). Formato inválido = 404.
  if (!z.string().uuid().safeParse(id).success) notFound();
  const wedding = await prisma.wedding.findUnique({ where: { id }, select: { id: true, coupleNames: true } });
  if (!wedding) notFound();

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Casais", href: "/admin/casais" }, { label: wedding.coupleNames, href: `/admin/casais/${id}` }, { label: "Entrar como este casal" }]}
        eyebrow="Impersonação"
        title="Entrar como este casal"
        description="Confirme o motivo. A entrada fica registrada e vale por 30 minutos."
      />
      <EntrarComoForm weddingId={wedding.id} coupleNames={wedding.coupleNames} backHref={`/admin/casais/${id}`} />
    </>
  );
}
