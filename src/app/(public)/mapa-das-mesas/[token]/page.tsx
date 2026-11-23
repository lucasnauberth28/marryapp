import type { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { AcheSuaMesa } from "./ache-sua-mesa";

export const dynamic = "force-dynamic";

// O link é só de quem recebeu: fora dos buscadores
export const metadata: Metadata = {
  title: "Ache a sua mesa",
  robots: { index: false, follow: false },
};

/**
 * "Ache a sua mesa". Só leitura: a página não grava nada e não expõe telefone nem e-mail. O código vem do casal
 * (Wedding.tablesShareToken). A lista inteira não aparece: o convidado digita o nome e vê só quem combina.
 */
export default async function MapaDasMesasPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(token)) notFound();

  const wedding = await prisma.wedding.findUnique({ where: { tablesShareToken: token }, select: { id: true, coupleNames: true, suspendedAt: true } });
  if (!wedding || wedding.suspendedAt) notFound();

  const [tables, guests] = await Promise.all([
    prisma.table.findMany({ where: { weddingId: wedding.id }, select: { id: true, name: true, capacity: true }, orderBy: { createdAt: "asc" } }),
    prisma.guest.findMany({ where: { weddingId: wedding.id, tableId: { not: null } }, select: { id: true, name: true, allowedCompanions: true, tableId: true }, orderBy: { name: "asc" } }),
  ]);
  const ocupados = new Map<string, number>();
  for (const g of guests) ocupados.set(g.tableId!, (ocupados.get(g.tableId!) ?? 0) + 1 + (g.allowedCompanions || 0));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
      <AcheSuaMesa
        coupleNames={wedding.coupleNames}
        mesas={tables.map((t) => ({ id: t.id, name: t.name, capacity: t.capacity, occupied: ocupados.get(t.id) ?? 0 }))}
        convidados={guests.map((g) => ({ id: g.id, name: g.name, tableId: g.tableId! }))}
      />
    </main>
  );
}
