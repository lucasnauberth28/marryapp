"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { emailEstaConfigurado } from "@/lib/email";
import { conferirLimiteDeUso } from "@/lib/security/rate-limiter";
import { falhaDeAdminDaPlataforma, exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { MAXIMO_DE_DESTINATARIOS, entradaDoComunicado, rotuloDoPublico, esquemaDoPublico, validarUrlDoLink, type EntradaDoComunicado } from "@/lib/platform/announcement";
import { preverPublico, resolverPessoasDoPublico, type PrevisaoDoPublico } from "@/lib/platform/queries/comunicados";
import { processarComunicado, enfileirarDestinatarios, atualizarTotaisDoComunicado, liberarReservasAntigas, enviarTesteDoComunicado } from "@/lib/platform/announcement-send";

import { ERROS } from "@/lib/mensagens-de-erro";
/**
 * Comunicados da administração. Todo destinatário é resolvido AQUI, a partir do filtro de público
 * (nunca de uma lista vinda do navegador). Limites: até 5.000 pessoas por envio e 5 envios por hora.
 * Agendamento não existe: não há rotina que envie na hora marcada.
 */

type Falha = { success: false; error: string; fieldErrors?: Record<string, string> };
const UM_MINUTO_EM_MS = 60_000;

/** Valida o formulário e devolve os dados limpos ou a falha com mensagens por campo. */
function validarComunicado(input: unknown): { ok: true; data: EntradaDoComunicado; linkUrl: string | null } | { ok: false; fail: Falha } {
  const parsed = entradaDoComunicado.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
    return { ok: false, fail: { success: false, error: ERROS.camposInvalidos, fieldErrors } };
  }
  const link = validarUrlDoLink(parsed.data.linkUrl);
  if (!link.ok) return { ok: false, fail: { success: false, error: ERROS.camposInvalidos, fieldErrors: { linkUrl: link.error } } };
  return { ok: true, data: parsed.data, linkUrl: link.url };
}

/** Quantas pessoas o público alcança agora (contagem real, para o texto "Chega a N casais"). */
export async function preverPublicoDoComunicado(input: unknown): Promise<{ success: true; preview: PrevisaoDoPublico } | Falha> {
  try {
    await exigirAdminDaPlataforma();
    const audience = esquemaDoPublico.parse(input);
    return { success: true, preview: await preverPublico(audience) };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "previewAnnouncementAudience");
  }
}

async function gravarLinhaDoRascunho(data: EntradaDoComunicado, linkUrl: string | null, admin: { userId: string; name: string | null }) {
  const values = {
    title: data.title,
    emailSubject: data.emailSubject || null,
    body: data.body,
    linkUrl,
    audience: data.audience,
    channels: data.channels,
  };
  if (data.id) {
    const res = await prisma.announcement.updateMany({ where: { id: data.id, status: "DRAFT" }, data: values });
    if (res.count !== 1) return null; // não existe ou já foi enviado
    return data.id;
  }
  const created = await prisma.announcement.create({ data: { ...values, createdById: admin.userId, createdByName: admin.name ?? "Administrador" }, select: { id: true } });
  return created.id;
}

export async function salvarRascunhoDoComunicado(input: unknown): Promise<{ success: true; id: string; message: string } | Falha> {
  try {
    const admin = await exigirAdminDaPlataforma();
    const v = validarComunicado(input);
    if (!v.ok) return v.fail;
    const id = await gravarLinhaDoRascunho(v.data, v.linkUrl, admin);
    if (!id) return { success: false, error: "Este comunicado não pode mais ser editado (já foi enviado ou não existe)." };
    await registrarAuditoria({ action: "announcement.draft_save", targetType: "announcement", targetId: id, details: { title: v.data.title, channels: v.data.channels, audience: rotuloDoPublico(v.data.audience) } });
    revalidatePath("/admin/comunicados");
    return { success: true, id, message: "Rascunho salvo." };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "saveAnnouncementDraft");
  }
}

export async function excluirRascunhoDoComunicado(input: unknown): Promise<{ success: true; message: string } | Falha> {
  try {
    await exigirAdminDaPlataforma();
    const { id } = z.object({ id: z.string().uuid() }).parse(input);
    const res = await prisma.announcement.deleteMany({ where: { id, status: "DRAFT" } });
    if (res.count !== 1) return { success: false, error: "Rascunho não encontrado." };
    await registrarAuditoria({ action: "announcement.draft_delete", targetType: "announcement", targetId: id });
    revalidatePath("/admin/comunicados");
    return { success: true, message: "Rascunho excluído." };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "deleteAnnouncementDraft");
  }
}

/** Envia um teste só para a pessoa logada (painel, celular e e-mail), sem registrar destinatários. */
export async function enviarTesteDoComunicadoParaMim(input: unknown): Promise<{ success: true; message: string } | Falha> {
  try {
    const admin = await exigirAdminDaPlataforma();
    const v = validarComunicado(input);
    if (!v.ok) return v.fail;
    const limit = await conferirLimiteDeUso({ key: `ANNOUNCE_TEST:${admin.userId}`, limit: 10, windowMs: 60 * UM_MINUTO_EM_MS });
    if (!limit.success) return { success: false, error: "Muitos testes seguidos. Aguarde um pouco." };
    const result = await enviarTesteDoComunicado(admin, {
      title: v.data.title,
      emailSubject: v.data.emailSubject,
      body: v.data.body,
      linkUrl: v.linkUrl,
      channels: v.data.channels,
      service: v.data.audience.service,
    });
    await registrarAuditoria({ action: "announcement.test", targetType: "announcement", details: { title: v.data.title, channels: v.data.channels } });
    if (result.done.length === 0) return { success: false, error: result.notes.join(" ") || "Nada foi enviado." };
    return { success: true, message: `Teste enviado (${result.done.join(", ")}).${result.notes.length ? ` ${result.notes.join(" ")}` : ""}` };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "sendAnnouncementTestToMe");
  }
}

/** Envia o comunicado agora. O envio roda depois da resposta (after) e pode ser retomado se for interrompido. */
export async function enviarComunicadoAgora(input: unknown): Promise<{ success: true; id: string; message: string } | Falha> {
  try {
    const admin = await exigirAdminDaPlataforma();
    const v = validarComunicado(input);
    if (!v.ok) return v.fail;
    const { data } = v;

    if (data.channels.includes("EMAIL") && !emailEstaConfigurado()) {
      return { success: false, error: "O e-mail não está configurado no servidor (RESEND_API_KEY). Tire o canal E-mail ou configure o envio." };
    }
    const limit = await conferirLimiteDeUso({ key: `ANNOUNCE_SEND:${admin.userId}`, limit: 5, windowMs: 60 * UM_MINUTO_EM_MS });
    if (!limit.success) return { success: false, error: "Você já fez 5 envios na última hora. Aguarde um pouco." };

    const users = await resolverPessoasDoPublico(data.audience);
    if (users.length === 0) return { success: false, error: "Esse público não alcança ninguém. Mude o filtro." };
    if (users.length > MAXIMO_DE_DESTINATARIOS) return { success: false, error: `Esse público tem ${users.length} pessoas e o limite por envio é ${MAXIMO_DE_DESTINATARIOS}. Restrinja o público.` };

    const id = await gravarLinhaDoRascunho(data, v.linkUrl, admin);
    if (!id) return { success: false, error: "Este comunicado já foi enviado ou não existe." };

    // Só o primeiro clique passa de DRAFT para SENDING: duplo clique ou reenvio não duplica nada
    const claimed = await prisma.announcement.updateMany({ where: { id, status: "DRAFT" }, data: { status: "SENDING", recipientCount: users.length } });
    if (claimed.count !== 1) return { success: false, error: "Este comunicado já foi enviado." };

    await enfileirarDestinatarios(id, users, data.channels, data.audience.service);
    await registrarAuditoria({
      action: "announcement.send",
      targetType: "announcement",
      targetId: id,
      details: { title: data.title, channels: data.channels, audience: rotuloDoPublico(data.audience), recipients: users.length, service: data.audience.service },
    });
    after(() => processarComunicado(id));
    revalidatePath("/admin/comunicados");
    return { success: true, id, message: `Envio começou para ${users.length} ${users.length === 1 ? "pessoa" : "pessoas"}. Acompanhe no histórico.` };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "sendAnnouncementNow");
  }
}

/** Retoma um envio interrompido: libera as reservas velhas e processa o que sobrou (quem já recebeu não repete). */
export async function retomarComunicado(input: unknown): Promise<{ success: true; message: string } | Falha> {
  try {
    const admin = await exigirAdminDaPlataforma();
    const { id } = z.object({ id: z.string().uuid() }).parse(input);
    const limit = await conferirLimiteDeUso({ key: `ANNOUNCE_RESUME:${admin.userId}`, limit: 10, windowMs: 60 * UM_MINUTO_EM_MS });
    if (!limit.success) return { success: false, error: "Muitas tentativas seguidas. Aguarde um pouco." };
    const found = await prisma.announcement.findUnique({ where: { id }, select: { status: true } });
    if (!found || found.status !== "SENDING") return { success: false, error: "Este envio não está em andamento." };
    const released = await liberarReservasAntigas(id);
    await registrarAuditoria({ action: "announcement.resume", targetType: "announcement", targetId: id, details: { released } });
    after(async () => {
      await processarComunicado(id);
      await atualizarTotaisDoComunicado(id);
    });
    revalidatePath("/admin/comunicados");
    return { success: true, message: "Retomamos o envio." };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "resumeAnnouncement");
  }
}
