// Remetente dos e-mails do Aceito (sem banco nem Next, roda nos testes).
// A configuração da administração (Configurações > E-mails e remetentes) sobrepõe a variável EMAIL_FROM quando
// há um e-mail de envio preenchido; vazio = tudo como antes (EMAIL_FROM ou o padrão do código).

export const DEFAULT_FROM = "Aceito <nao-responda@meuaceito.com.br>";

export interface EmailSenderConfig {
  fromName: string;
  fromEmail: string;
  replyTo: string;
}

/** Nome para o campo From: sem aspas, sinais de menor/maior nem quebras de linha (evita forjar outro remetente). */
export function cleanSenderName(name: string): string {
  return name.replace(/[\r\n]+/g, " ").replace(/[<>"]/g, "").replace(/\s+/g, " ").trim().slice(0, 80);
}

/** Remetente de uma mensagem e se ele vem da configuração da administração (custom) ou do ambiente. */
export function resolveSender(config: EmailSenderConfig, envFrom: string | undefined): { from: string; replyTo: string | null; custom: boolean } {
  const fallback = envFrom?.trim() || DEFAULT_FROM;
  const email = config.fromEmail.trim();
  const replyTo = config.replyTo.trim() || null;
  if (!email) return { from: fallback, replyTo, custom: false };
  const name = cleanSenderName(config.fromName) || "Aceito";
  return { from: `${name} <${email}>`, replyTo, custom: true };
}

/** "suporte@aceito" -> mensagem pedindo o final do endereço (.com.br); null se o e-mail parece completo. */
export function emailDomainProblem(email: string): string | null {
  const text = email.trim();
  if (!text) return null;
  if (!/^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+$/.test(text)) return "Confira o e-mail: falta o @ ou tem algum caractere que não pode.";
  const domain = text.split("@")[1] ?? "";
  if (!/\.[a-z]{2,}$/i.test(domain)) return "Falta o final do endereço, como .com.br";
  return null;
}
