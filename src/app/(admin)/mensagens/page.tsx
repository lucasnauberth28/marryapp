// src/app/(admin)/mensagens/page.tsx
import prisma from "@/lib/prisma";
import { exigirCasamentoNaPagina } from "@/lib/security/wedding-context";
import { casamentoTemModulo } from "@/lib/casamento/wedding-plan";
import { CartaoDeUpgrade } from "@/components/plan/upgrade-card";
import { MensagensCliente } from "./mensagens-cliente";
import { garantirModelosPadrao } from "@/actions/mensagens/modelos";
import { obterIdentidadeDoCasamentoPrincipal } from "@/lib/casamento/wedding";
import { escolhasDoConvite } from "@/lib/convidados/convite-digital";
import { urlDoSiteDoCasamento } from "@/lib/casamento/wedding-links";

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
  const [conviteDisponivel, escolhas] = await Promise.all([casamentoTemModulo({ weddingId, session }, "convite"), escolhasDoConvite(weddingId)]);

  return (
    <MensagensCliente
      coupleNames={coupleNames}
      slug={wedding.slug}
      customDomain={wedding.customDomain ?? null}
      initialTemplates={JSON.parse(JSON.stringify(templates))} 
      initialGuests={JSON.parse(JSON.stringify(convidados))} 
      convite={{ disponivel: conviteDisponivel, guestName: escolhas.guestName, message: escolhas.message, linkDeExemplo: urlDoSiteDoCasamento(wedding.slug, "convite", wedding.customDomain) }}
    />
  );
}
