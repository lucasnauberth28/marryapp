import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { requireWeddingPage } from "@/lib/security/wedding-context";
import { casamentoTemModulo } from "@/lib/wedding-plan";
import { UpgradeCard } from "@/components/plan/upgrade-card";
import { Mesas3DView } from "@/components/mesas3d/mesas-3d-view";
import { isSceneId } from "@/lib/mesas3d/scenarios";
import { seatsOfGuest } from "@/lib/mesas3d/seating";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Mesas em 3D" };

export default async function Mesas3DPage() {
  const { session, weddingId, wedding } = await requireWeddingPage("/mesas");
  if (!(await casamentoTemModulo({ weddingId, session }, "tables3d"))) return <UpgradeCard moduleId="tables3d" />;

  const [row, tables, guests] = await Promise.all([
    prisma.wedding.findUnique({ where: { id: weddingId }, select: { tables3dScene: true, tables3dShareToken: true } }),
    prisma.table.findMany({ where: { weddingId }, select: { id: true, name: true, capacity: true }, orderBy: { createdAt: "asc" } }),
    // Quem já tem mesa e quem confirmou presença (a mesma regra da lista de mesas)
    prisma.guest.findMany({
      where: { weddingId, OR: [{ tableId: { not: null } }, { rsvpStatus: "CONFIRMED" }] },
      select: { id: true, name: true, category: true, allowedCompanions: true, tableId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <Mesas3DView
      mode="edit"
      coupleNames={wedding.coupleNames}
      initialScene={isSceneId(row?.tables3dScene) ? row.tables3dScene : null}
      tables={tables}
      guests={guests.map((g) => ({ id: g.id, name: g.name, category: g.category, seats: seatsOfGuest(g.allowedCompanions), tableId: g.tableId }))}
      initialShareToken={row?.tables3dShareToken ?? null}
    />
  );
}
