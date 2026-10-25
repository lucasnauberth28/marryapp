import { z } from "zod";
import { estaEmSilencioAgora, type PreferenciasDeNotificacao } from "../notifications/preferences.ts";
import { CANAIS, type Canal, esquemaDoPublico } from "./announcement-audience.ts";

const TAMANHO_MAXIMO_DO_TITULO_DO_COMUNICADO = 90;
const TAMANHO_MAXIMO_DO_ASSUNTO_DO_COMUNICADO = 120;
const TAMANHO_MAXIMO_DO_CORPO_DO_COMUNICADO = 1000;
/** Mais pessoas que isto não saem de uma vez: reduza o público (proteção contra envio em massa por engano). */
export const MAXIMO_DE_DESTINATARIOS = 5000;

export function validarUrlDoLink(input: string): { ok: true; url: string | null } | { ok: false; error: string } {
  const text = input.trim();
  if (!text) return { ok: true, url: null };
  if (!/^https:\/\//i.test(text)) return { ok: false, error: "Use um endereço que comece com https://" };
  try {
    const url = new URL(text);
    if (!url.hostname.includes(".") || url.username || url.password) return { ok: false, error: "Confira o endereço do link." };
    return { ok: true, url: url.toString() };
  } catch {
    return { ok: false, error: "Confira o endereço do link." };
  }
}

export const entradaDoComunicado = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3, "Dê um título ao comunicado.").max(TAMANHO_MAXIMO_DO_TITULO_DO_COMUNICADO, `Use até ${TAMANHO_MAXIMO_DO_TITULO_DO_COMUNICADO} caracteres.`),
  emailSubject: z.string().trim().max(TAMANHO_MAXIMO_DO_ASSUNTO_DO_COMUNICADO, `Use até ${TAMANHO_MAXIMO_DO_ASSUNTO_DO_COMUNICADO} caracteres.`).optional().default(""),
  body: z.string().trim().min(5, "Escreva a mensagem.").max(TAMANHO_MAXIMO_DO_CORPO_DO_COMUNICADO, `Use até ${TAMANHO_MAXIMO_DO_CORPO_DO_COMUNICADO} caracteres.`),
  linkUrl: z.string().max(500).optional().default(""),
  audience: esquemaDoPublico,
  channels: z.array(z.enum(CANAIS)).min(1, "Escolha por onde avisar.").max(3),
});
export type EntradaDoComunicado = z.infer<typeof entradaDoComunicado>;


export type MotivoDePulo = "no_email" | "opted_out" | "quiet_hours";

export const TEXTO_DO_PULO: Record<MotivoDePulo | "no_device", string> = {
  no_email: "Sem e-mail válido no cadastro",
  opted_out: "Escolheu não receber este tipo de aviso",
  quiet_hours: "Horário de silêncio",
  no_device: "Sem aparelho com avisos ativados",
};

const PADRAO_DE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const parecEmail = (value: string | null | undefined): value is string => !!value && PADRAO_DE_EMAIL.test(value);

/**
 * Cada pessoa e canal começam PENDING ou já saem SKIPPED com o motivo.
 * O aviso no painel nunca é pulado. Novidade respeita as preferências (grupo "Plano e conta"); aviso de serviço
 * ignora a escolha de não receber e o horário de silêncio. E-mail exige endereço válido nos dois casos.
 */
export function decidirEntrega(input: {
  channel: Canal;
  service: boolean;
  username: string;
  prefs: PreferenciasDeNotificacao;
  now: Date;
}): { status: "PENDING" } | { status: "SKIPPED"; reason: MotivoDePulo } {
  const { channel, service, username, prefs, now } = input;
  if (channel === "PANEL") return { status: "PENDING" };
  if (channel === "EMAIL" && !parecEmail(username)) return { status: "SKIPPED", reason: "no_email" };
  if (service) return { status: "PENDING" };
  const key = channel === "PUSH" ? "push" : "email";
  if (!prefs.channels[key].account) return { status: "SKIPPED", reason: "opted_out" };
  if (channel === "PUSH" && estaEmSilencioAgora(prefs.quietHours, now)) return { status: "SKIPPED", reason: "quiet_hours" };
  return { status: "PENDING" };
}

/** "Entregues" do histórico: enviados sobre (enviados + falhas). Pulados ficam de fora. Null sem base. */
export function taxaDeEntrega(counts: { sent: number; failed: number }): number | null {
  const base = counts.sent + counts.failed;
  return base === 0 ? null : Math.round((counts.sent / base) * 100);
}

/** Parágrafos do e-mail: a mensagem em texto puro, um parágrafo por linha em branco. */
export function paragrafosDoCorpo(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
}

/** Aceita `?casais=id1,id2` da lista de Casais: só uuids, sem repetir, no máximo 500. */
export function interpretarParametroDeIdsDeCasamento(value: string | undefined): string[] {
  if (!value) return [];
  const ids = value.split(",").map((s) => s.trim()).filter((s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s));
  return [...new Set(ids.map((s) => s.toLowerCase()))].slice(0, 500);
}
