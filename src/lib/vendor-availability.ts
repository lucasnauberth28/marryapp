import "server-only";
import prisma from "@/lib/prisma";

const DAY_MS = 86_400_000;

/**
 * Fornecedores ocupados num dia: data bloqueada na agenda ou casamento fechado
 * (pedido CLOSED com a data do casamento). Reuniões não ocupam o dia.
 * `day` é a data à meia-noite UTC (mesmo formato das datas de casamento).
 */
export async function getUnavailableVendorIds(day: Date, vendorIds?: string[]): Promise<Set<string>> {
  const vendorFilter = vendorIds ? { vendorId: { in: vendorIds } } : {};
  const [blocked, weddings] = await Promise.all([
    prisma.vendorEvent.findMany({
      where: { ...vendorFilter, kind: "BLOCKED", date: day },
      select: { vendorId: true },
      distinct: ["vendorId"],
    }),
    prisma.vendorLead.findMany({
      where: {
        ...vendorFilter,
        status: "CLOSED",
        weddingDate: { gte: day, lt: new Date(day.getTime() + DAY_MS) },
      },
      select: { vendorId: true },
      distinct: ["vendorId"],
    }),
  ]);
  return new Set([...blocked, ...weddings].map((r) => r.vendorId));
}

export async function isVendorAvailable(vendorId: string, day: Date): Promise<boolean> {
  const busy = await getUnavailableVendorIds(day, [vendorId]);
  return !busy.has(vendorId);
}
