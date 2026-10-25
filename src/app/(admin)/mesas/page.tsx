import { obterMesasComConvidados, obterConvidadosSemMesa } from "@/actions/table-actions";
import { MesasCliente } from "./mesas-cliente";
import { exigirCasamentoNaPagina } from "@/lib/security/wedding-context";

export const dynamic = "force-dynamic";

export const metadata = { title: "Mesas" };

export default async function TablesPage() {
  await exigirCasamentoNaPagina("/mesas");
  const [tables, unassignedGuests] = await Promise.all([obterMesasComConvidados(), obterConvidadosSemMesa()]);

  return <MesasCliente initialTables={tables} initialUnassigned={unassignedGuests} />;
}
