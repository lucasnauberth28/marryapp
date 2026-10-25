import "server-only";
import { registrarEventoDeServico } from "@/lib/platform/system-records";
import { obterRemetenteDeEmail } from "@/lib/platform/email-sender";
import { REMETENTE_PADRAO } from "@/lib/platform/email-sender-core";

/**
 * Envio de e-mails transacionais (convite do par, redefinição de senha) pela API REST da Resend.
 *
 * - Com RESEND_API_KEY configurada, envia de EMAIL_FROM (padrão "Aceito <nao-responda@meuaceito.com.br>").
 * - Sem a chave, registra um aviso de uma linha (sem destinatário completo nem conteúdo, que pode
 *   conter tokens) e devolve { sent: false }. Nunca lança erro: quem chama decide o que mostrar.
 */

const ENDERECO_DO_RESEND = "https://api.resend.com/emails";

export interface EntradaDoEnvioDeEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export type ResultadoDoEnvioDeEmail = { sent: true; id: string | null } | { sent: false; reason: "not_configured" | "invalid_recipient" | "failed" };

const PADRAO_DE_EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]+$/;

/** "ana@exemplo.com" -> "a***@exemplo.com", para logs. */
function esconderEmail(email: string) {
  const [user, domain] = email.split("@");
  return `${user?.charAt(0) ?? ""}***@${domain ?? ""}`;
}

export function emailEstaConfigurado() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function enviarEmail({ to, subject, html, text }: EntradaDoEnvioDeEmail): Promise<ResultadoDoEnvioDeEmail> {
  const recipient = String(to ?? "").trim().toLowerCase();
  if (!PADRAO_DE_EMAIL.test(recipient) || recipient.length > 254) return { sent: false, reason: "invalid_recipient" };

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY ausente: e-mail "${subject}" para ${esconderEmail(recipient)} não foi enviado.`);
    return { sent: false, reason: "not_configured" };
  }

  try {
    const sender = await obterRemetenteDeEmail();
    const post = (from: string) =>
      fetch(ENDERECO_DO_RESEND, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [recipient],
          subject,
          html,
          text,
          ...(sender.replyTo ? { reply_to: sender.replyTo } : {}),
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
    let res = await post(sender.from);
    // Remetente configurado na administração recusado (domínio não verificado na Resend): tenta de novo com o do ambiente,
    // para um endereço errado nas Configurações nunca parar todos os e-mails.
    if (!res.ok && sender.custom && (res.status === 403 || res.status === 422)) {
      console.warn(`[email] Resend recusou o remetente configurado (${res.status}); usando o remetente do ambiente.`);
      res = await post(process.env.EMAIL_FROM?.trim() || REMETENTE_PADRAO);
    }

    if (!res.ok) {
      console.error(`[email] Resend respondeu ${res.status} ao enviar "${subject}" para ${esconderEmail(recipient)}.`);
      // Saúde do sistema: só o código HTTP, nunca destinatário nem conteúdo
      await registrarEventoDeServico({ service: "email", kind: "send", ok: false, message: `Resend respondeu ${res.status}` });
      return { sent: false, reason: "failed" };
    }
    const body = (await res.json().catch(() => null)) as { id?: string } | null;
    await registrarEventoDeServico({ service: "email", kind: "send", ok: true });
    return { sent: true, id: body?.id ?? null };
  } catch (error) {
    console.error(`[email] Falha ao enviar "${subject}" para ${esconderEmail(recipient)}:`, error instanceof Error ? error.message : error);
    await registrarEventoDeServico({ service: "email", kind: "send", ok: false, message: error instanceof Error && error.name === "TimeoutError" ? "Tempo esgotado ao falar com a Resend" : "Falha de conexão com a Resend" });
    return { sent: false, reason: "failed" };
  }
}

// O modelo dos e-mails da marca mora em email-template.ts (sem server-only, para testar e pré-visualizar).
export { emailDaMarca, type EntradaDoEmailDaMarca } from "./email-template.ts";
