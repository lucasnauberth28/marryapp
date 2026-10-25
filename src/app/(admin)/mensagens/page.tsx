// src/app/(admin)/mensagens/page.tsx
import prisma from "@/lib/prisma";
import { exigirCasamentoNaPagina } from "@/lib/security/wedding-context";
import { casamentoTemModulo } from "@/lib/wedding-plan";
import { CartaoDeUpgrade } from "@/components/plan/upgrade-card";
import { MensagensCliente } from "./mensagens-client";
import { garantirModelosPadrao } from "@/actions/message-actions";
import { obterIdentidadeDoCasamentoPrincipal } from "@/lib/wedding";

export const metadata = { title: "Mensagens" };

export default async function MensagensPage() {
  const { session, weddingId, wedding } = await exigirCasamentoNaPagina("/mensagens");
  if (!(await casamentoTemModulo({ weddingId, session }, "whatsapp"))) return <CartaoDeUpgrade moduleId="whatsapp" />;

  // Casal novo começa com os modelos padrão (convite e lembrete); quem já tem modelos não muda
  await garantirModelosPadrao();

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

  const { coupleNames } = await obterIdentidadeDoCasamentoPrincipal();

  return (
    <MensagensCliente
      coupleNames={coupleNames}
      slug={wedding.slug}
      customDomain={wedding.customDomain ?? null}
      initialTemplates={JSON.parse(JSON.stringify(templates))} 
      initialGuests={JSON.parse(JSON.stringify(convidados))} 
    />
  );
}
