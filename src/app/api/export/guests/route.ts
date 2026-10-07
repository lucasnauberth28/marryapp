import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AuthorizationError, requirePathPermission } from "@/lib/security/auth-guard";

/**
 * Escapa um valor para CSV e neutraliza injeção de fórmulas (=, +, -, @) ao abrir no Excel/Sheets.
 */
function csvCell(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`;
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET() {
  try {
    await requirePathPermission("/convidados");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    throw error;
  }

  try {
    const guests = await prisma.guest.findMany({
      include: { table: true },
      orderBy: { name: "asc" },
    });

    const header = ["Nome", "Telefone", "Status RSVP", "Acompanhantes (Permitidos)", "Mesa"].map(csvCell).join(",");
    const rows = guests.map((guest) => {
      const status = guest.rsvpStatus === "CONFIRMED" ? "Confirmado" : guest.rsvpStatus === "DECLINED" ? "Declinou" : "Pendente";
      return [guest.name, guest.phone, status, guest.allowedCompanions || 0, guest.table?.name ?? "Sem Mesa"]
        .map(csvCell)
        .join(",");
    });

    // BOM para o Excel abrir com a acentuação correta
    const csvWithBOM = "﻿" + [header, ...rows].join("\n") + "\n";

    return new NextResponse(csvWithBOM, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="lista_de_convidados.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error exporting guests:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
