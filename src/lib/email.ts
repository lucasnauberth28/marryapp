import "server-only";

/**
 * Envio de e-mails transacionais (convite do par, redefinição de senha) pela API REST da Resend.
 *
 * - Com RESEND_API_KEY configurada, envia de EMAIL_FROM (padrão "Aceito <nao-responda@meuaceito.com.br>").
 * - Sem a chave, registra um aviso de uma linha (sem destinatário completo nem conteúdo, que pode
 *   conter tokens) e devolve { sent: false }. Nunca lança erro: quem chama decide o que mostrar.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "Aceito <nao-responda@meuaceito.com.br>";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export type SendEmailResult = { sent: true; id: string | null } | { sent: false; reason: "not_configured" | "invalid_recipient" | "failed" };

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]+$/;

/** "ana@exemplo.com" -> "a***@exemplo.com", para logs. */
function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  return `${user?.charAt(0) ?? ""}***@${domain ?? ""}`;
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function sendEmail({ to, subject, html, text }: SendEmailInput): Promise<SendEmailResult> {
  const recipient = String(to ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(recipient) || recipient.length > 254) return { sent: false, reason: "invalid_recipient" };

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY ausente: e-mail "${subject}" para ${maskEmail(recipient)} não foi enviado.`);
    return { sent: false, reason: "not_configured" };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM?.trim() || DEFAULT_FROM,
        to: [recipient],
        subject,
        html,
        text,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.error(`[email] Resend respondeu ${res.status} ao enviar "${subject}" para ${maskEmail(recipient)}.`);
      return { sent: false, reason: "failed" };
    }
    const body = (await res.json().catch(() => null)) as { id?: string } | null;
    return { sent: true, id: body?.id ?? null };
  } catch (error) {
    console.error(`[email] Falha ao enviar "${subject}" para ${maskEmail(recipient)}:`, error instanceof Error ? error.message : error);
    return { sent: false, reason: "failed" };
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface BrandedEmailInput {
  /** Título grande do e-mail. */
  heading: string;
  /** Parágrafos antes do botão (texto puro, escapado aqui). */
  paragraphs: string[];
  cta?: { label: string; url: string };
  /** Parágrafos menores depois do botão (ex.: validade do link, "se não foi você..."). */
  footnotes?: string[];
  /** Texto curto que aparece na prévia da caixa de entrada. */
  preheader?: string;
}

/**
 * Modelo simples com a identidade do Aceito (linho, papel, ameixa), em tabelas e estilos inline
 * para funcionar nos clientes de e-mail. Devolve também a versão em texto puro.
 */
export function brandedEmail({ heading, paragraphs, cta, footnotes = [], preheader }: BrandedEmailInput): { html: string; text: string } {
  const p = (t: string, style: string) => `<p style="margin:0 0 16px;${style}">${escapeHtml(t)}</p>`;
  const button = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="border-radius:12px;background:#5E2B4E">
<a href="${escapeHtml(cta.url)}" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#FFFDF9;text-decoration:none;border-radius:12px">${escapeHtml(cta.label)}</a>
</td></tr></table>
<p style="margin:0 0 16px;font-size:13px;line-height:20px;color:#5F5560">Se o botão não abrir, copie este endereço no navegador:<br><a href="${escapeHtml(cta.url)}" style="color:#5E2B4E;word-break:break-all">${escapeHtml(cta.url)}</a></p>`
    : "";

  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:#F7F3EC">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F3EC;padding:32px 16px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:0 8px 20px;font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#5E2B4E">aceito</td></tr>
<tr><td style="background:#FFFDF9;border:1px solid #DDD4C7;border-radius:16px;padding:32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:24px;color:#231C24">
<h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:28px;line-height:34px;color:#231C24">${escapeHtml(heading)}</h1>
${paragraphs.map((t) => p(t, "")).join("\n")}
${button}
${footnotes.map((t) => p(t, "font-size:13px;line-height:20px;color:#5F5560")).join("\n")}
</td></tr>
<tr><td style="padding:20px 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#5F5560">Aceito · Do convite ao grande dia, tudo num só sim.<br>Este é um e-mail automático; não é preciso responder.</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  const text = [
    heading,
    "",
    ...paragraphs,
    ...(cta ? ["", `${cta.label}: ${cta.url}`] : []),
    ...(footnotes.length ? ["", ...footnotes] : []),
    "",
    "Aceito · Do convite ao grande dia, tudo num só sim.",
  ].join("\n");

  return { html, text };
}
