import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  // Verifica autenticação usando cookies, similar ao verifyAdminSession
  const cookieStore = await cookies();
  const token = cookieStore.get("marryapp_admin_session")?.value;

  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const guests = await prisma.guest.findMany({
      include: {
        table: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Cabeçalhos do CSV
    let csvContent = "Nome,Telefone,Status RSVP,Acompanhantes (Permitidos),Mesa\n";

    // Linhas de dados
    guests.forEach((guest) => {
      const name = guest.name ? `"${guest.name.replace(/"/g, '""')}"` : "";
      const phone = guest.phone ? `"${guest.phone}"` : "";
      const status = guest.rsvpStatus === "CONFIRMED" ? "Confirmado" : guest.rsvpStatus === "DECLINED" ? "Declinou" : "Pendente";
      const companions = guest.allowedCompanions || 0;
      const table = guest.table ? `"${guest.table.name.replace(/"/g, '""')}"` : "Sem Mesa";

      csvContent += `${name},${phone},${status},${companions},${table}\n`;
    });

    // BOM for UTF-8 (para o Excel abrir com a acentuação correta)
    const BOM = "\uFEFF";
    const csvWithBOM = BOM + csvContent;

    return new NextResponse(csvWithBOM, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="lista_de_convidados.csv"',
      },
    });
  } catch (error) {
    console.error("Error exporting guests:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
