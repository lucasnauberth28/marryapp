import type { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Mesas3DView } from "@/components/mesas3d/mesas-3d-view";
import { isSceneId } from "@/lib/mesas3d/scenarios";
import { seatsOfGuest } from "@/lib/mesas3d/seating";

export const dynamic = "force-dynamic";

// O link é só de quem recebeu: fora dos buscadores
export const metadata: Metadata = {
  title: "Mapa das mesas",
  robots: { index: false, follow: false },
};

/**
 * Link de visualização das mesas em 3D. Só leitura: a página não grava nada e não expõe telefone nem e-mail,
 * só o nome, o grupo e a mesa de quem já foi sentado. O código vem do casal (Wedding.tables3dShareToken).
 */
export default async function MapaDasMesasPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(token)) notFound();

  const wedding = await prisma.wedding.findUnique({
    where: { tables3dShareToken: token },
    select: { id: true, coupleNames: true, tables3dScene: true, suspendedAt: true },
  });
  if (!wedding || wedding.suspendedAt) notFound();

  const [tables, guests] = await Promise.all([
    prisma.table.findMany({ where: { weddingId: wedding.id }, select: { id: true, name: true, capacity: true }, orderBy: { createdAt: "asc" } }),
    prisma.guest.findMany({
      where: { weddingId: wedding.id, tableId: { not: null } },
      select: { id: true, name: true, category: true, allowedCompanions: true, tableId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-6 md:px-8">
      <Mesas3DView
        mode="view"
        coupleNames={wedding.coupleNames}
        initialScene={isSceneId(wedding.tables3dScene) ? wedding.tables3dScene : "jardim"}
        tables={tables}
        guests={guests.map((g) => ({ id: g.id, name: g.name, category: g.category, seats: seatsOfGuest(g.allowedCompanions), tableId: g.tableId }))}
      />
    </div>
  );
}
