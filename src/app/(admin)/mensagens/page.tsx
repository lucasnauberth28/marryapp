// src/app/(admin)/mensagens/page.tsx
import prisma from "@/lib/prisma";
import { requireWeddingPage } from "@/lib/security/wedding-context";
import { MensagensClient } from "./mensagens-client";
import { getWeddingIdentity } from "@/lib/wedding";

export const metadata = { title: "Mensagens" };

export default async function MensagensPage() {
  const { weddingId, wedding } = await requireWeddingPage("/mensagens");

  // Busca os templates do casamento
  const templates = await prisma.messageTemplate.findMany({
    where: { weddingId },
    orderBy: { createdAt: "desc" },
  });

  // Busca os convidados do casamento (para o disparador)
  const convidados = await prisma.guest.findMany({
    where: { weddingId },
    orderBy: { name: "asc" },
  });

  const { coupleNames } = await getWeddingIdentity();

  return (
    <MensagensClient
      coupleNames={coupleNames}
      slug={wedding.slug}
      initialTemplates={JSON.parse(JSON.stringify(templates))} 
      initialGuests={JSON.parse(JSON.stringify(convidados))} 
    />
  );
}
