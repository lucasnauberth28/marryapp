import { getTablesWithGuests, getUnassignedGuests } from "@/actions/table-actions";
import { TablesClient } from "./tables-client";

export const dynamic = "force-dynamic";

export const metadata = { title: "Mesas" };

export default async function TablesPage() {
  const tables = await getTablesWithGuests();
  const unassignedGuests = await getUnassignedGuests();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 text-balance">Mesas</h1>
        <p className="mt-1 text-sm text-stone-600">Organize os lugares dos seus convidados confirmados.</p>
      </div>
      
      <TablesClient initialTables={tables} initialUnassigned={unassignedGuests} />
    </div>
  );
}
