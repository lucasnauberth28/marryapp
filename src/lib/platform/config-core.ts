// Regras puras da tela de Configurações: integrações (só presença de variável), limites de uso em texto e
// validação dos formulários. Sem banco nem Next: roda nos testes.
import { z } from "zod";
import { emailDomainProblem } from "./email-sender-core.ts";
import { joinBackAt } from "./maintenance-core.ts";

export interface IntegrationDef {
  id: string;
  name: string;
  /** Todas estas variáveis precisam estar preenchidas para contar como "Conectado". */
  vars: string[];
  /** Variável NÃO secreta cujo final (4 últimos caracteres) pode ser mostrado. Nunca um token ou segredo. */
  publicKeyVar?: string;
}

export const INTEGRATIONS: IntegrationDef[] = [
  { id: "mercadopago", name: "Mercado Pago (pagamentos)", vars: ["MERCADOPAGO_ACCESS_TOKEN"], publicKeyVar: "NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY" },
  { id: "mercadopago-webhook", name: "Mercado Pago (assinatura dos avisos)", vars: ["MERCADOPAGO_WEBHOOK_SECRET"] },
  { id: "pix", name: "Pix estático (planos)", vars: ["PIX_KEY", "PIX_MERCHANT_NAME", "PIX_MERCHANT_CITY"] },
  { id: "whatsapp", name: "WhatsApp (Evolution API)", vars: ["EVOLUTION_API_URL", "EVOLUTION_API_KEY", "EVOLUTION_INSTANCE"] },
  { id: "email", name: "E-mail (Resend)", vars: ["RESEND_API_KEY"] },
  { id: "push", name: "Notificações no celular (VAPID)", vars: ["VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY"] },
  { id: "sentry", name: "Sentry (erros)", vars: ["SENTRY_DSN"] },
  { id: "vercel", name: "Vercel (domínios próprios)", vars: ["VERCEL_API_TOKEN", "VERCEL_PROJECT_ID"] },
  { id: "storage", name: "Imagens (Supabase Storage)", vars: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_KEY"] },
  { id: "ratelimit", name: "Limite de tentativas compartilhado (Upstash)", vars: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"] },
  { id: "cron", name: "Rotinas diárias (segredo da Vercel Cron)", vars: ["CRON_SECRET"] },
];

export interface IntegrationStatus {
  id: string;
  name: string;
  connected: boolean;
  /** Final da chave pública (4 caracteres), só quando a variável é pública. Nunca de segredos. */
  tail: string | null;
}

/** Conectado = todas as variáveis presentes (nunca o valor). `env` entra por parâmetro para testar sem process.env. */
export function integrationStatus(def: IntegrationDef, env: Record<string, string | undefined>): IntegrationStatus {
  const connected = def.vars.every((v) => Boolean(env[v]?.trim()));
  const pub = def.publicKeyVar ? (env[def.publicKeyVar] ?? env.NEXT_PUBLIC_MP_PUBLIC_KEY)?.trim() : undefined;
  return { id: def.id, name: def.name, connected, tail: pub && pub.length >= 8 ? pub.slice(-4) : null };
}

/** "5 por 10 minutos", "20 por 15 minutos", "30 por minuto": o limite do código em texto. */
export function describeLimit(limit: number, windowMs: number): string {
  const min = windowMs / 60_000;
  if (min === 1) return `${limit} por minuto`;
  if (min < 60) return `${limit} a cada ${min} minutos`;
  const h = min / 60;
  return `${limit} por ${h === 1 ? "hora" : `${h} horas`}`;
}

export const maintenanceInput = z.object({
  enabled: z.boolean(),
  message: z.string().trim().max(300, "Use até 300 caracteres."),
  backDate: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Use uma data válida.").default(""),
  backTime: z.string().regex(/^(([01]\d|2[0-3]):[0-5]\d)?$/, "Use uma hora válida, como 23:30.").default(""),
});

/** Valida o formulário de manutenção: ligar exige mensagem e, se houver hora de volta, ela precisa estar no futuro. */
export function parseMaintenance(
  input: unknown,
  now: Date = new Date(),
): { ok: true; value: { enabled: boolean; message: string; backAt: string | null } } | { ok: false; errors: Record<string, string> } {
  const parsed = maintenanceInput.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0] ?? "form")] ??= issue.message;
    return { ok: false, errors };
  }
  const { enabled, message, backDate, backTime } = parsed.data;
  const errors: Record<string, string> = {};
  if ((backDate && !backTime) || (!backDate && backTime)) errors[backDate ? "backTime" : "backDate"] = "Preencha a data e a hora, ou deixe as duas vazias.";
  const backAt = backDate && backTime ? joinBackAt(backDate, backTime) : null;
  if (backDate && backTime && !backAt) errors.backDate = "Use uma data e hora válidas.";
  if (enabled && !message) errors.message = "Escreva o que as pessoas vão ver.";
  if (enabled && backAt && new Date(backAt).getTime() <= now.getTime()) errors.backDate = "A hora de volta precisa estar no futuro.";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { enabled, message, backAt } };
}

export const emailSenderInput = z.object({
  fromName: z.string().trim().max(80, "Use até 80 caracteres."),
  fromEmail: z.string().trim().toLowerCase().max(200),
  replyTo: z.string().trim().toLowerCase().max(200),
});

export function parseEmailSender(input: unknown): { ok: true; value: z.infer<typeof emailSenderInput> } | { ok: false; errors: Record<string, string> } {
  const parsed = emailSenderInput.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0] ?? "form")] ??= issue.message;
    return { ok: false, errors };
  }
  const errors: Record<string, string> = {};
  const a = emailDomainProblem(parsed.data.fromEmail);
  const b = emailDomainProblem(parsed.data.replyTo);
  if (a) errors.fromEmail = a;
  if (b) errors.replyTo = b;
  if (!parsed.data.fromEmail && parsed.data.fromName) errors.fromEmail = "Para trocar o nome, preencha também o e-mail de envio.";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: parsed.data };
}

export const refundPolicyInput = z.object({
  days: z.string().regex(/^\d{1,2}$/, "Use um número de dias, de 0 a 90.").refine((v) => Number(v) <= 90, "Use um número de dias, de 0 a 90."),
  text: z.string().trim().min(10, "Escreva o texto que o casal vai ler.").max(1000, "Use até 1.000 caracteres."),
});
