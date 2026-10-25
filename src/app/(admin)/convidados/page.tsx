import { Metadata } from "next";
import { obterConvidados } from "@/actions/convidados/lista";
import { ConvidadosCliente } from "./convidados-cliente";
import prisma from "@/lib/prisma";
import { exigirCasamentoNaPagina } from "@/lib/security/wedding-context";
import { casamentoTemModulo } from "@/lib/casamento/wedding-plan";

import { formatarDataCivilLonga } from "@/lib/formatacao/data";
export const metadata: Metadata = {
  title: "Convidados",
  description: "Gerencie a lista de convidados do casamento",
};

export const dynamic = "force-dynamic";


// Filtros da lista que um link de fora pode abrir (ex.: a sugestão da Liz em "Ver convidados sem resposta")
const RESPOSTAS_POSSIVEIS = { "sem-resposta": "PENDING", confirmados: "CONFIRMED", "nao-vao": "DECLINED" } as const;

export default async function ConvidadosPage({ searchParams }: { searchParams: Promise<{ resposta?: string }> }) {
  const { session, weddingId } = await exigirCasamentoNaPagina("/convidados");
  const { resposta } = await searchParams;
  const initialFilter = RESPOSTAS_POSSIVEIS[resposta as keyof typeof RESPOSTAS_POSSIVEIS] ?? "all";

  // Só leitura: o prazo de confirmação definido em Configurações, se houver
  const [guests, settings, canRemind] = await Promise.all([
    obterConvidados(),
    prisma.systemSettings.findUnique({ where: { weddingId }, select: { rsvpDeadline: true } }),
    casamentoTemModulo({ weddingId, session }, "whatsapp"),
  ]);

  return (
    <ConvidadosCliente
      initialGuests={guests}
      deadlineLabel={settings?.rsvpDeadline ? formatarDataCivilLonga(settings.rsvpDeadline) : null}
      canRemind={canRemind}
      initialFilter={initialFilter}
    />
  );
}
