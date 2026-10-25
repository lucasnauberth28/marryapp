// Monta o envelope do Sentry à mão (HTTP API), sem SDK. Arquivo puro: sem server-only, sem prisma,
// sem imports de Node, para rodar em qualquer runtime e ser testado direto.

export interface DsnInterpretado {
  publicKey: string;
  projectId: string;
  /** URL de POST do envelope: https://<host>/<prefixo>/api/<projeto>/envelope/ */
  envelopeUrl: string;
}

/** https://<chave>@<host>/<projectId> -> partes necessárias; null se o DSN for inválido. */
export function interpretarDsn(dsn: string | undefined | null): DsnInterpretado | null {
  if (!dsn) return null;
  let url: URL;
  try {
    url = new URL(dsn.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const publicKey = decodeURIComponent(url.username);
  if (!publicKey) return null;
  // Último segmento é o projeto; o que vier antes é prefixo (Sentry self-hosted em subcaminho).
  const segments = url.pathname.split("/").filter(Boolean);
  const projectId = segments.pop();
  if (!projectId || !/^[A-Za-z0-9_-]+$/.test(projectId)) return null;
  const prefix = segments.length ? `/${segments.join("/")}` : "";
  return {
    publicKey,
    projectId,
    envelopeUrl: `${url.protocol}//${url.host}${prefix}/api/${projectId}/envelope/`,
  };
}

export interface ContextoDoErro {
  error: { name?: string; message?: string; stack?: string; digest?: string };
  /** Caminho da requisição; a query é descartada (pode carregar tokens). */
  path?: string;
  method?: string;
  /** Rota do App Router, ex.: /casamento/[slug]. */
  routePath?: string;
  routeType?: string;
  environment?: string;
  release?: string;
}

const TAMANHO_MAXIMO_DA_MENSAGEM = 1000;
const MAXIMO_DE_QUADROS = 50;

export function tirarParametrosDaUrl(path: string | undefined): string | undefined {
  if (!path) return undefined;
  return path.split(/[?#]/)[0];
}

interface Quadro {
  function?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
}

/** Converte a stack do V8 ("at fn (arquivo:linha:col)") em frames do Sentry (do mais antigo ao mais novo). */
export function interpretarPilhaDeChamadas(stack: string | undefined): Quadro[] {
  if (!stack) return [];
  const frames: Quadro[] = [];
  for (const raw of stack.split("\n")) {
    const line = raw.trim();
    if (!line.startsWith("at ")) continue;
    const body = line.slice(3);
    const m = /^(?:(.*?) \()?(.*?):(\d+):(\d+)\)?$/.exec(body);
    if (m) {
      frames.push({ function: m[1] || undefined, filename: m[2], lineno: Number(m[3]), colno: Number(m[4]) });
    } else {
      frames.push({ function: body });
    }
  }
  return frames.slice(0, MAXIMO_DE_QUADROS).reverse();
}

function novoIdDeEvento(): string {
  return globalThis.crypto.randomUUID().replace(/-/g, "");
}

/**
 * Evento do Sentry a partir do erro. Só entram: tipo, mensagem, stack, rota, método, ambiente e release.
 * Nunca cookies, headers (autorização) ou corpo da requisição.
 */
export function montarEvento(ctx: ContextoDoErro, opts: { eventId?: string; now?: Date } = {}) {
  const message = (ctx.error.message ?? "").slice(0, TAMANHO_MAXIMO_DA_MENSAGEM);
  const path = tirarParametrosDaUrl(ctx.path);
  const tags: Record<string, string> = {};
  if (ctx.routePath) tags.route = ctx.routePath;
  if (ctx.routeType) tags.route_type = ctx.routeType;
  if (ctx.error.digest) tags.digest = ctx.error.digest;

  return {
    event_id: opts.eventId ?? novoIdDeEvento(),
    timestamp: (opts.now ?? new Date()).getTime() / 1000,
    platform: "node",
    level: "error",
    environment: ctx.environment || "development",
    ...(ctx.release ? { release: ctx.release } : {}),
    tags,
    transaction: ctx.routePath ?? path,
    request: path ? { url: path, ...(ctx.method ? { method: ctx.method } : {}) } : undefined,
    exception: {
      values: [
        {
          type: ctx.error.name || "Error",
          value: message,
          stacktrace: { frames: interpretarPilhaDeChamadas(ctx.error.stack) },
        },
      ],
    },
  };
}

/** Envelope = 3 linhas JSON: cabeçalho, cabeçalho do item e o evento. */
export function montarEnvelope(event: ReturnType<typeof montarEvento>, sentAt: Date = new Date()): string {
  const header = { event_id: event.event_id, sent_at: sentAt.toISOString() };
  return [JSON.stringify(header), JSON.stringify({ type: "event" }), JSON.stringify(event)].join("\n");
}

/** Cabeçalho X-Sentry-Auth (chave pública do DSN). */
export function cabecalhoDeAutenticacao(dsn: DsnInterpretado): string {
  return `Sentry sentry_version=7, sentry_client=aceito/1.0, sentry_key=${dsn.publicKey}`;
}
