// Cliente da API REST da Vercel para domínios de projeto. Sem "server-only" e com `fetch` injetável,
// para testar com respostas simuladas (os testes nunca chamam a Vercel de verdade).
// O arquivo vercel-domains.ts lê as variáveis de ambiente e usa este.
//
// Contrato usado (conferir na documentação da Vercel antes de ir ao ar; ver relatório):
//  - POST /v10/projects/{projectId}/domains          corpo { name }          adiciona o domínio ao projeto
//  - GET  /v9/projects/{projectId}/domains/{domain}                            { name, verified, verification[] }
//  - POST /v9/projects/{projectId}/domains/{domain}/verify                     tenta verificar de novo
//  - GET  /v6/domains/{domain}/config                                          { misconfigured, configuredBy,
//                                                                               recommendedIPv4[{rank,value[]}],
//                                                                               recommendedCNAME[{rank,value}] }
//  - Autenticação: Authorization: Bearer <token>; conta de time: ?teamId=<id>
// Tolerante: campos que faltam viram valores padrão e a resposta nunca derruba a tela.

export interface VercelConfig {
  token: string;
  projectId: string;
  teamId?: string;
  /** Padrão https://api.vercel.com (os testes apontam para um servidor local). */
  base?: string;
  timeoutMs?: number;
}

export interface DnsRecord {
  type: "A" | "CNAME" | "TXT";
  /** Nome do registro na zona do domínio: "@" (raiz), "www" ou "_vercel". */
  name: string;
  value: string;
  /** "vercel" = valor devolvido pela Vercel; "default" = valor padrão conhecido quando a Vercel não devolveu. */
  source: "vercel" | "default";
}

export type ConnectionState =
  /** Domínio no projeto e apontado: dá para marcar como no ar. */
  | "ready"
  /** Domínio no projeto, mas o DNS ainda não aponta para a Vercel. */
  | "pending_dns"
  /** A Vercel pede uma prova de que o domínio é nosso (registro TXT). */
  | "pending_verification";

export type ConnectionResult =
  | { ok: true; state: ConnectionState; added: boolean; records: DnsRecord[]; message: string }
  | { ok: false; reason: "not_configured" | "auth" | "api" | "network"; message: string };

export const DEFAULT_VERCEL_API = "https://api.vercel.com";
/** Valores padrão da Vercel, usados só se a resposta não trouxer os recomendados. */
export const DEFAULT_A_RECORD = "76.76.21.21";
export const DEFAULT_CNAME = "cname.vercel-dns.com";

const NOT_CONFIGURED = "A conexão automática com a Vercel não está configurada (faltam VERCEL_API_TOKEN e VERCEL_PROJECT_ID). Configure o domínio na Vercel à mão e use \"Marcar como no ar\".";

type FetchLike = typeof fetch;

interface Raw {
  status: number;
  body: Record<string, unknown> | null;
}

async function call(cfg: VercelConfig, doFetch: FetchLike, method: "GET" | "POST", path: string, json?: unknown): Promise<Raw> {
  const url = new URL(`${(cfg.base || DEFAULT_VERCEL_API).replace(/\/+$/, "")}${path}`);
  if (cfg.teamId) url.searchParams.set("teamId", cfg.teamId);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs ?? 10_000);
  try {
    const response = await doFetch(url.toString(), {
      method,
      headers: { authorization: `Bearer ${cfg.token}`, ...(json !== undefined ? { "content-type": "application/json" } : {}) },
      body: json !== undefined ? JSON.stringify(json) : undefined,
      signal: controller.signal,
      cache: "no-store",
      redirect: "error",
    });
    const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    return { status: response.status, body: body && typeof body === "object" ? body : null };
  } finally {
    clearTimeout(timer);
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown) => (typeof v === "string" ? v : "");

/** Código de erro da Vercel: { error: { code, message } }. */
function errorCode(body: Raw["body"]): string {
  const err = body && isObj(body.error) ? body.error : null;
  return err ? str(err.code) : "";
}

/** Registros TXT que a Vercel pede quando o domínio ainda não foi provado como nosso. */
export function verificationRecords(domainBody: Raw["body"]): DnsRecord[] {
  const list = domainBody && Array.isArray(domainBody.verification) ? domainBody.verification : [];
  const out: DnsRecord[] = [];
  for (const item of list) {
    if (!isObj(item)) continue;
    const type = str(item.type).toUpperCase();
    const value = str(item.value);
    const host = str(item.domain);
    if (type !== "TXT" || !value || !host) continue;
    out.push({ type: "TXT", name: host, value, source: "vercel" });
  }
  return out;
}

/** Registros A (raiz) e CNAME (www) a criar, com os valores recomendados da Vercel. */
export function dnsRecordsFromConfig(configBody: Raw["body"]): DnsRecord[] {
  let ipv4 = "";
  let cname = "";
  if (configBody) {
    const ips = Array.isArray(configBody.recommendedIPv4) ? configBody.recommendedIPv4.filter(isObj) : [];
    ips.sort((a, b) => Number(a.rank ?? 99) - Number(b.rank ?? 99));
    for (const entry of ips) {
      const value = Array.isArray(entry.value) ? entry.value.find((v): v is string => typeof v === "string") : str(entry.value);
      if (value) {
        ipv4 = value;
        break;
      }
    }
    const names = Array.isArray(configBody.recommendedCNAME) ? configBody.recommendedCNAME.filter(isObj) : [];
    names.sort((a, b) => Number(a.rank ?? 99) - Number(b.rank ?? 99));
    cname = names.map((n) => str(n.value)).find(Boolean) ?? "";
  }
  const fromVercel = Boolean(ipv4);
  return [
    { type: "A", name: "@", value: ipv4 || DEFAULT_A_RECORD, source: fromVercel ? "vercel" : "default" },
    { type: "CNAME", name: "www", value: (cname || DEFAULT_CNAME).replace(/\.$/, ""), source: cname ? "vercel" : "default" },
  ];
}

function fail(status: number, body: Raw["body"]): ConnectionResult {
  if (status === 401 || status === 403) {
    return { ok: false, reason: "auth", message: "A Vercel recusou o acesso. Confira VERCEL_API_TOKEN, VERCEL_PROJECT_ID e VERCEL_TEAM_ID." };
  }
  const detail = body && isObj(body.error) ? str(body.error.message) : "";
  return { ok: false, reason: "api", message: `A Vercel respondeu com erro (${status})${detail ? `: ${detail}` : ""}.` };
}

async function readState(
  cfg: VercelConfig,
  doFetch: FetchLike,
  domain: string,
  options: { added: boolean; recheck: boolean },
): Promise<ConnectionResult> {
  const project = encodeURIComponent(cfg.projectId);
  const name = encodeURIComponent(domain);

  if (options.recheck) {
    // Pede para a Vercel verificar de novo; a resposta de sucesso ou de "ainda não" é lida logo abaixo
    await call(cfg, doFetch, "POST", `/v9/projects/${project}/domains/${name}/verify`).catch(() => null);
  }
  const info = await call(cfg, doFetch, "GET", `/v9/projects/${project}/domains/${name}`);
  if (info.status === 404) {
    return { ok: false, reason: "api", message: "O domínio ainda não foi adicionado ao projeto na Vercel. Use \"Conectar ao site\" primeiro." };
  }
  if (info.status !== 200) return fail(info.status, info.body);
  const config = await call(cfg, doFetch, "GET", `/v6/domains/${name}/config`);
  if (config.status === 401 || config.status === 403) return fail(config.status, config.body);

  const verified = info.body?.verified === true;
  const misconfigured = config.status === 200 ? config.body?.misconfigured !== false : true;
  const records = dnsRecordsFromConfig(config.status === 200 ? config.body : null);

  if (!verified) {
    const txt = verificationRecords(info.body);
    return {
      ok: true,
      state: "pending_verification",
      added: options.added,
      records: [...txt, ...records],
      message: "A Vercel pede uma prova de que o domínio pode ser usado neste projeto. Crie também o registro TXT abaixo.",
    };
  }
  if (misconfigured) {
    return {
      ok: true,
      state: "pending_dns",
      added: options.added,
      records,
      message: "Domínio no projeto. Falta criar os registros DNS abaixo na zona do domínio (Registro.br) e esperar a propagação.",
    };
  }
  return { ok: true, state: "ready", added: options.added, records, message: "Tudo certo: o domínio aponta para o site e está verificado." };
}

/** Adiciona o domínio (e o www) ao projeto e devolve a situação com os registros DNS. */
export async function connectDomain(cfg: VercelConfig | null, domain: string, doFetch: FetchLike = fetch): Promise<ConnectionResult> {
  if (!cfg?.token || !cfg.projectId) return { ok: false, reason: "not_configured", message: NOT_CONFIGURED };
  try {
    const project = encodeURIComponent(cfg.projectId);
    let added = false;
    for (const name of [domain, `www.${domain}`]) {
      const res = await call(cfg, doFetch, "POST", `/v10/projects/${project}/domains`, { name });
      if (res.status === 200 || res.status === 201) {
        added = true;
        continue;
      }
      // Já estava no projeto: tudo bem (pode repetir o botão)
      const code = errorCode(res.body);
      if (res.status === 409 && /already/i.test(code)) continue;
      if (name === domain) return fail(res.status, res.body);
      // O www é opcional: se só ele falhar, seguimos com a raiz
    }
    return await readState(cfg, doFetch, domain, { added, recheck: false });
  } catch {
    return { ok: false, reason: "network", message: "Não foi possível falar com a Vercel agora. Tente de novo em instantes." };
  }
}

/** Consulta a situação atual (pedindo antes uma nova verificação) sem adicionar nada. */
export async function verifyDomain(cfg: VercelConfig | null, domain: string, doFetch: FetchLike = fetch): Promise<ConnectionResult> {
  if (!cfg?.token || !cfg.projectId) return { ok: false, reason: "not_configured", message: NOT_CONFIGURED };
  try {
    return await readState(cfg, doFetch, domain, { added: false, recheck: true });
  } catch {
    return { ok: false, reason: "network", message: "Não foi possível falar com a Vercel agora. Tente de novo em instantes." };
  }
}
