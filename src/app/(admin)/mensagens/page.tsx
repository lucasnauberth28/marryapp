// src/app/(admin)/mensagens/page.tsx
import prisma from "@/lib/prisma";
import { verifyAdminSession } from "@/actions/auth-actions";
import { MensagensClient } from "./mensagens-client";

export default async function MensagensPage() {
  await verifyAdminSession();

  // Busca todos os templates
  const templates = await prisma.messageTemplate.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Busca todos os convidados (para o disparador)
  const convidados = await prisma.guest.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <MensagensClient 
      initialTemplates={JSON.parse(JSON.stringify(templates))} 
      initialGuests={JSON.parse(JSON.stringify(convidados))} 
    />
  );
}
