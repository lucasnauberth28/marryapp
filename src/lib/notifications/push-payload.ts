// Montagem do aviso por push e regras de entrega aos aparelhos. Arquivo puro: quem fala com a rede
// e com o banco entra por `deps`, o que deixa tudo testável com um envio de mentira.

export interface PushPayload {
  title: string;
  body: string;
  /** Para onde o toque leva (sempre um caminho interno). */
  href: string;
  /** Avisos com a mesma tag se substituem na bandeja, em vez de empilhar. */
  tag: string;
  icon: string;
  badge: string;
}

export interface PushSource {
  title: string;
  body: string;
  href: string | null;
  dedupeKey: string;
}

export const PUSH_ICON = "/icons/icon-192.png";
export const PUSH_BADGE = "/icons/badge-96.png";

// O push aceita cerca de 4 KB no total; textos longos são cortados bem abaixo disso.
const MAX_TITLE = 80;
const MAX_BODY = 200;

const cut = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

/** Só caminhos internos ("/financas"): nada de "//outro.site" nem "https://...". */
export function safeInternalHref(href: string | null | undefined, fallback = "/"): string {
  if (!href || !href.startsWith("/") || href.startsWith("//") || href.includes("\\")) return fallback;
  return href;
}

export function buildPushPayload(source: PushSource): PushPayload {
  return {
    title: cut(source.title.replace(/\s+/g, " ").trim(), MAX_TITLE) || "Aceito",
    body: cut(source.body.replace(/\s+/g, " ").trim(), MAX_BODY),
    href: safeInternalHref(source.href),
    tag: source.dedupeKey.slice(0, 100),
    icon: PUSH_ICON,
    badge: PUSH_BADGE,
  };
}

/**
 * Endereços de push que aceitamos guardar. O servidor envia uma requisição para o endereço do aparelho,
 * então só os serviços de push dos navegadores entram (evita usar o cadastro para chamar outros sites).
 */
const PUSH_HOSTS = [
  /^fcm\.googleapis\.com$/, // Chrome, Edge, Opera, Samsung, Brave
  /^updates\.push\.services\.mozilla\.com$/, // Firefox
  /(^|\.)push\.services\.mozilla\.com$/,
  /(^|\.)push\.apple\.com$/, // Safari e app instalado no iPhone
  /(^|\.)notify\.windows\.com$/, // Edge antigo
];

export function isAllowedPushEndpoint(endpoint: unknown): endpoint is string {
  if (typeof endpoint !== "string" || endpoint.length > 2048) return false;
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
  return PUSH_HOSTS.some((re) => re.test(url.hostname));
}

/** 404 e 410: o aparelho cancelou ou o endereço expirou. Não adianta tentar de novo. */
export function isSubscriptionGone(statusCode: unknown): boolean {
  return statusCode === 404 || statusCode === 410;
}

export interface StoredSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushDeliveryDeps {
  /** Envia um push; lança erro com `statusCode` quando o serviço recusa. */
  send: (subscription: StoredSubscription, body: string) => Promise<void>;
  /** Apaga o aparelho (endereço morto). */
  remove: (endpoint: string) => Promise<void>;
  /** Marca o último uso de quem recebeu. */
  touch: (endpoints: string[]) => Promise<void>;
}

export interface PushDeliveryReport {
  sent: number;
  removed: number;
  failed: number;
}

/**
 * Entrega o mesmo aviso a todos os aparelhos de uma pessoa. Aparelho com endereço morto é apagado;
 * qualquer outro erro (rede, serviço fora do ar) só conta como falha e o aparelho continua cadastrado.
 */
export async function deliverPush(
  subscriptions: StoredSubscription[],
  payload: PushPayload,
  deps: PushDeliveryDeps,
): Promise<PushDeliveryReport> {
  const report: PushDeliveryReport = { sent: 0, removed: 0, failed: 0 };
  if (subscriptions.length === 0) return report;

  const body = JSON.stringify(payload);
  const delivered: string[] = [];
  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await deps.send(sub, body);
        report.sent++;
        delivered.push(sub.endpoint);
      } catch (error) {
        const status = (error as { statusCode?: unknown } | null)?.statusCode;
        if (isSubscriptionGone(status)) {
          report.removed++;
          await deps.remove(sub.endpoint).catch(() => undefined);
        } else {
          report.failed++;
        }
      }
    }),
  );
  if (delivered.length > 0) await deps.touch(delivered).catch(() => undefined);
  return report;
}
