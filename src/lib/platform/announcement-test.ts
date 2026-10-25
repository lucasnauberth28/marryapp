// Comunicados: o envio de teste, só para a pessoa da administração (não registra destinatários nem conta no histórico).
import "server-only";
import prisma from "@/lib/prisma";
import { enviarEmail } from "@/lib/email/email";
import { enviarPushParaAPessoa } from "@/lib/notifications/push";
import { montarConteudoDoPush } from "@/lib/notifications/push-payload";
import type { Canal } from "@/lib/platform/announcement-audience";
import { emailPara, textoDaFalha } from "@/lib/platform/announcement-send";

/** Teste: manda só para a pessoa da administração, sem registrar destinatários nem contar no histórico. */
export async function enviarTesteDoComunicado(
  admin: { userId: string },
  input: { title: string; emailSubject: string; body: string; linkUrl: string | null; channels: Canal[]; service: boolean },
): Promise<{ done: string[]; notes: string[] }> {
  const done: string[] = [];
  const notes: string[] = [];
  const user = await prisma.user.findUnique({ where: { id: admin.userId }, select: { id: true, username: true } });
  if (!user) return { done, notes: ["A conta de emergência não é um usuário cadastrado, então não recebe testes. Entre com uma conta da equipe."] };
  const title = `[Teste] ${input.title}`.slice(0, 200);
  if (input.channels.includes("PANEL")) {
    await prisma.notification.create({
      data: { userId: user.id, type: "announcement", title, body: input.body.slice(0, 1000), href: input.linkUrl, dedupeKey: `announcement-test:${crypto.randomUUID()}` },
    });
    done.push("aviso no painel");
  }
  if (input.channels.includes("PUSH")) {
    const report = await enviarPushParaAPessoa(user.id, montarConteudoDoPush({ title, body: input.body, href: input.linkUrl, dedupeKey: "announcement-test" }));
    if (report.sent > 0) done.push("notificação no celular");
    else notes.push(report.devices === 0 ? "Notificação: você não tem aparelho com avisos ativados." : "Notificação: não foi possível enviar.");
  }
  if (input.channels.includes("EMAIL")) {
    const mail = emailPara({ title, body: input.body, linkUrl: input.linkUrl }, input.service);
    const result = await enviarEmail({ to: user.username, subject: `[Teste] ${input.emailSubject.trim() || input.title}`, html: mail.html, text: mail.text });
    if (result.sent) done.push("e-mail");
    else notes.push(`E-mail: ${textoDaFalha(result.reason)}.`);
  }
  return { done, notes };
}
