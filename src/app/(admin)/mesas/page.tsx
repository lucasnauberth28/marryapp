import { obterMesasComConvidados, obterConvidadosSemMesa } from "@/actions/table-actions";
import { MesasCliente } from "./mesas-cliente";
import { exigirCasamentoNaPagina } from "@/lib/security/wedding-context";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = { title: "Mesas" };

export default async function TablesPage() {
  const { weddingId } = await exigirCasamentoNaPagina("/mesas");
  const [tables, unassignedGuests, wedding] = await Promise.all([
    obterMesasComConvidados(),
    obterConvidadosSemMesa(),
    prisma.wedding.findUnique({ where: { id: weddingId }, select: { tablesShareToken: true } }),
  ]);

  return <MesasCliente initialTables={tables} initialUnassigned={unassignedGuests} shareToken={wedding?.tablesShareToken ?? null} />;
}
