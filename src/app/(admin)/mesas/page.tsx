import { getTablesWithGuests, getUnassignedGuests } from "@/actions/table-actions";
import { TablesClient } from "./tables-client";
import { exigirCasamentoNaPagina } from "@/lib/security/wedding-context";

export const dynamic = "force-dynamic";

export const metadata = { title: "Mesas" };

export default async function TablesPage() {
  await exigirCasamentoNaPagina("/mesas");
  const [tables, unassignedGuests] = await Promise.all([getTablesWithGuests(), getUnassignedGuests()]);

  return <TablesClient initialTables={tables} initialUnassigned={unassignedGuests} />;
}
