import { getTablesWithGuests, getUnassignedGuests } from "@/actions/table-actions";
import { TablesClient } from "./tables-client";

export const dynamic = "force-dynamic";

export default async function TablesPage() {
  const tables = await getTablesWithGuests();
  const unassignedGuests = await getUnassignedGuests();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#8C6D45] font-serif italic tracking-tight">Mapa de Mesas</h1>
        <p className="text-zinc-500 mt-1">Organize os lugares dos seus convidados confirmados.</p>
      </div>
      
      <TablesClient initialTables={tables} initialUnassigned={unassignedGuests} />
    </div>
  );
}
