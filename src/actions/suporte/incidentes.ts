"use server";

// Suporte (administração): incidentes de segurança.
import prisma from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { falhaDeAdminDaPlataforma, exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { diaParaData, entradaDoIncidente, entradaDeAtualizacaoDoIncidente } from "@/lib/platform/support";
import { type Falha, type Sucesso, atualizarPaginas, falhaDeValidacao } from "@/actions/suporte/comum";

export async function criarIncidenteDeSeguranca(input: unknown): Promise<Sucesso | Falha> {
  try {
    const admin = await exigirAdminDaPlataforma();
    const parsed = entradaDoIncidente.safeParse(input);
    if (!parsed.success) return falhaDeValidacao(parsed.error);
    const d = parsed.data;
    const created = await prisma.securityIncident.create({
      data: {
        title: d.title,
        description: d.description,
        affected: d.affected || null,
        discoveredAt: diaParaData(d.discoveredAt),
        notifiedAt: d.notifiedOn ? diaParaData(d.notifiedOn) : null,
        notifiedWho: d.notifiedWho || null,
        createdById: admin.userId,
        createdByName: admin.name ?? "Administrador",
      },
      select: { id: true },
    });
    await registrarAuditoria({ action: "incident.create", targetType: "security_incident", targetId: created.id, details: { title: d.title, discoveredAt: d.discoveredAt, notified: Boolean(d.notifiedOn) } });
    atualizarPaginas();
    return { success: true, message: "Incidente registrado." };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "createSecurityIncident");
  }
}

/** Atualiza quando e quem foi avisado, ou fecha/reabre o incidente. */
export async function atualizarIncidenteDeSeguranca(input: unknown): Promise<Sucesso | Falha> {
  try {
    await exigirAdminDaPlataforma();
    const parsed = entradaDeAtualizacaoDoIncidente.safeParse(input);
    if (!parsed.success) return falhaDeValidacao(parsed.error);
    const d = parsed.data;
    const current = await prisma.securityIncident.findUnique({ where: { id: d.id }, select: { id: true, status: true } });
    if (!current) return { success: false, error: "Incidente não encontrado." };
    await prisma.securityIncident.update({
      where: { id: d.id },
      data: {
        notifiedAt: d.notifiedOn ? diaParaData(d.notifiedOn) : null,
        notifiedWho: d.notifiedWho || null,
        ...(d.close ? { status: "CLOSED", closedAt: new Date() } : d.reopen ? { status: "OPEN", closedAt: null } : {}),
      },
    });
    await registrarAuditoria({ action: d.close ? "incident.close" : d.reopen ? "incident.reopen" : "incident.update", targetType: "security_incident", targetId: d.id, details: { notified: Boolean(d.notifiedOn) } });
    atualizarPaginas();
    return { success: true, message: d.close ? "Incidente fechado." : d.reopen ? "Incidente reaberto." : "Incidente atualizado." };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "updateSecurityIncident");
  }
}
