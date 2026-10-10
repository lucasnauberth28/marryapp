// src/app/(admin)/mensagens/page.tsx
import prisma from "@/lib/prisma";
import { requireWeddingPage } from "@/lib/security/wedding-context";
import { weddingHasModule } from "@/lib/wedding-plan";
import { UpgradeCard } from "@/components/plan/upgrade-card";
import { MensagensClient } from "./mensagens-client";
import { ensureDefaultTemplates } from "@/actions/message-actions";
import { getWeddingIdentity } from "@/lib/wedding";

export const metadata = { title: "Mensagens" };

export default async function MensagensPage() {
  const { session, weddingId, wedding } = await requireWeddingPage("/mensagens");
  if (!(await weddingHasModule({ weddingId, session }, "whatsapp"))) return <UpgradeCard moduleId="whatsapp" />;

  // Casal novo começa com os modelos padrão (convite e lembrete); quem já tem modelos não muda
  await ensureDefaultTemplates();

  // Busca os modelos do casamento
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
