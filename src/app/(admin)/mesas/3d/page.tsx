import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { exigirCasamentoNaPagina } from "@/lib/security/wedding-context";
import { casamentoTemModulo } from "@/lib/casamento/wedding-plan";
import { CartaoDeUpgrade } from "@/components/plan/upgrade-card";
import { VisaoDasMesas3D } from "@/components/mesas3d/mesas-3d-view";
import { ehIdDeCenario } from "@/lib/mesas3d/scenarios";
import { lugaresDoConvidado } from "@/lib/mesas3d/seating";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Mesas em 3D" };

export default async function Mesas3DPage() {
  const { session, weddingId, wedding } = await exigirCasamentoNaPagina("/mesas");
  if (!(await casamentoTemModulo({ weddingId, session }, "tables3d"))) return <CartaoDeUpgrade moduleId="tables3d" />;

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
    <VisaoDasMesas3D
      mode="edit"
      coupleNames={wedding.coupleNames}
      initialScene={ehIdDeCenario(row?.tables3dScene) ? row.tables3dScene : null}
      tables={tables}
      guests={guests.map((g) => ({ id: g.id, name: g.name, category: g.category, seats: lugaresDoConvidado(g.allowedCompanions), tableId: g.tableId }))}
      initialShareToken={row?.tables3dShareToken ?? null}
    />
  );
}
