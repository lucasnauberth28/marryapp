import { Metadata } from "next";
import { getGuests } from "@/actions/guest-actions";
import { getTablesWithGuests, getUnassignedGuests } from "@/actions/table-actions";
import { GuestsClient } from "./guests-client";
import { requireWeddingPage } from "@/lib/security/wedding-context";

export const metadata: Metadata = {
  title: "Convidados",
  description: "Gerencie a lista de convidados e a organização de mesas do casamento",
};

export const dynamic = "force-dynamic";

export default async function ConvidadosPage() {
  await requireWeddingPage("/convidados");
  
  const [guests, tables, unassignedGuests] = await Promise.all([
    getGuests(),
    getTablesWithGuests(),
    getUnassignedGuests(),
  ]);

  return (
    <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GuestsClient
        initialGuests={guests}
        initialTables={tables}
        initialUnassigned={unassignedGuests}
      />
    </div>
  );
}
