import type { Instrumentation } from "next";
import { authHeader, buildEnvelope, buildEvent, parseDsn } from "@/lib/sentry-envelope";

/**
 * Envia erros do servidor ao Sentry pela API HTTP (envelope), sem SDK.
 * Só age se SENTRY_DSN estiver definido; sem ele não faz nada e não custa nada.
 * Cookies, headers e corpo da requisição nunca são lidos.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const dsn = parseDsn(process.env.SENTRY_DSN);
  if (!dsn) return;

  try {
    const err = error as Error & { digest?: string };
    const event = buildEvent({
      error: { name: err.name, message: err.message, stack: err.stack, digest: err.digest },
      path: request.path,
      method: request.method,
      routePath: context.routePath,
      routeType: context.routeType,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
      release: process.env.VERCEL_GIT_COMMIT_SHA,
    });
    const res = await fetch(dsn.envelopeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-sentry-envelope", "X-Sentry-Auth": authHeader(dsn) },
      body: buildEnvelope(event),
      // Monitoramento nunca pode travar nem derrubar a resposta ao usuário.
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) console.warn(`[Sentry] envio recusado (${res.status})`);
  } catch (e) {
    console.warn("[Sentry] falha ao enviar o erro:", e instanceof Error ? e.message : e);
  }
};
