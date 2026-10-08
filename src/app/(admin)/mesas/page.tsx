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
        <h1 className="font-display text-[32px] leading-[38px] tracking-[-0.01em] text-tinta text-balance md:text-[40px] md:leading-[46px]">Mesas</h1>
        <p className="mt-1 text-sm text-tinta-suave">Organize os lugares dos seus convidados confirmados.</p>
      </div>
      
      <TablesClient initialTables={tables} initialUnassigned={unassignedGuests} />
    </div>
  );
}
