import { getTablesWithGuests, getUnassignedGuests } from "@/actions/table-actions";
import { TablesClient } from "./tables-client";

export const dynamic = "force-dynamic";

export default async function TablesPage() {
  const tables = await getTablesWithGuests();
  const unassignedGuests = await getUnassignedGuests();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Mapa de Mesas</h2>
        <p className="text-zinc-500 mt-2">Organize os lugares dos seus convidados confirmados.</p>
      </div>
      
      <TablesClient initialTables={tables} initialUnassigned={unassignedGuests} />
    </div>
  );
}
