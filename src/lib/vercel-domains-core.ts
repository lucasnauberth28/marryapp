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

import { type RegistroDns, type RespostaBruta, codigoDoErro, converterEmTexto, ehObjeto, registrosDeVerificacao, registrosDnsDaConfiguracao } from "./vercel-domains-dns.ts";

export interface ConfiguracaoDaVercel {
  token: string;
  projectId: string;
  teamId?: string;
  /** Padrão https://api.vercel.com (os testes apontam para um servidor local). */
  base?: string;
  timeoutMs?: number;
}


type EstadoDaConexao =
  /** Domínio no projeto e apontado: dá para marcar como no ar. */
  | "ready"
  /** Domínio no projeto, mas o DNS ainda não aponta para a Vercel. */
  | "pending_dns"
  /** A Vercel pede uma prova de que o domínio é nosso (registro TXT). */
  | "pending_verification";

export type ResultadoDaConexao =
  | { ok: true; state: EstadoDaConexao; added: boolean; records: RegistroDns[]; message: string }
  | { ok: false; reason: "not_configured" | "auth" | "api" | "network"; message: string };

const API_PADRAO_DA_VERCEL = "https://api.vercel.com";

const NAO_CONFIGURADO = "A conexão automática com a Vercel não está configurada (faltam VERCEL_API_TOKEN e VERCEL_PROJECT_ID). Configure o domínio na Vercel à mão e use \"Marcar como no ar\".";

type BuscaCompativel = typeof fetch;


async function chamarApiDaVercel(cfg: ConfiguracaoDaVercel, doFetch: BuscaCompativel, method: "GET" | "POST", path: string, json?: unknown): Promise<RespostaBruta> {
  const url = new URL(`${(cfg.base || API_PADRAO_DA_VERCEL).replace(/\/+$/, "")}${path}`);
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



function falhar(status: number, body: RespostaBruta["body"]): ResultadoDaConexao {
  if (status === 401 || status === 403) {
    return { ok: false, reason: "auth", message: "A Vercel recusou o acesso. Confira VERCEL_API_TOKEN, VERCEL_PROJECT_ID e VERCEL_TEAM_ID." };
  }
  const detail = body && ehObjeto(body.error) ? converterEmTexto(body.error.message) : "";
  return { ok: false, reason: "api", message: `A Vercel respondeu com erro (${status})${detail ? `: ${detail}` : ""}.` };
}

async function lerEstado(
  cfg: ConfiguracaoDaVercel,
  doFetch: BuscaCompativel,
  domain: string,
  options: { added: boolean; recheck: boolean },
): Promise<ResultadoDaConexao> {
  const project = encodeURIComponent(cfg.projectId);
  const name = encodeURIComponent(domain);

  if (options.recheck) {
    // Pede para a Vercel verificar de novo; a resposta de sucesso ou de "ainda não" é lida logo abaixo
    await chamarApiDaVercel(cfg, doFetch, "POST", `/v9/projects/${project}/domains/${name}/verify`).catch(() => null);
  }
  const info = await chamarApiDaVercel(cfg, doFetch, "GET", `/v9/projects/${project}/domains/${name}`);
  if (info.status === 404) {
    return { ok: false, reason: "api", message: "O domínio ainda não foi adicionado ao projeto na Vercel. Use \"Conectar ao site\" primeiro." };
  }
  if (info.status !== 200) return falhar(info.status, info.body);
  const config = await chamarApiDaVercel(cfg, doFetch, "GET", `/v6/domains/${name}/config`);
  if (config.status === 401 || config.status === 403) return falhar(config.status, config.body);

  const verified = info.body?.verified === true;
  const misconfigured = config.status === 200 ? config.body?.misconfigured !== false : true;
  const records = registrosDnsDaConfiguracao(config.status === 200 ? config.body : null);

  if (!verified) {
    const txt = registrosDeVerificacao(info.body);
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
export async function conectarDominio(cfg: ConfiguracaoDaVercel | null, domain: string, doFetch: BuscaCompativel = fetch): Promise<ResultadoDaConexao> {
  if (!cfg?.token || !cfg.projectId) return { ok: false, reason: "not_configured", message: NAO_CONFIGURADO };
  try {
    const project = encodeURIComponent(cfg.projectId);
    let added = false;
    for (const name of [domain, `www.${domain}`]) {
      const res = await chamarApiDaVercel(cfg, doFetch, "POST", `/v10/projects/${project}/domains`, { name });
      if (res.status === 200 || res.status === 201) {
        added = true;
        continue;
      }
      // Já estava no projeto: tudo bem (pode repetir o botão)
      const code = codigoDoErro(res.body);
      if (res.status === 409 && /already/i.test(code)) continue;
      if (name === domain) return falhar(res.status, res.body);
      // O www é opcional: se só ele falhar, seguimos com a raiz
    }
    return await lerEstado(cfg, doFetch, domain, { added, recheck: false });
  } catch {
    return { ok: false, reason: "network", message: "Não foi possível falar com a Vercel agora. Tente de novo em instantes." };
  }
}

/** Consulta a situação atual (pedindo antes uma nova verificação) sem adicionar nada. */
export async function verificarDominio(cfg: ConfiguracaoDaVercel | null, domain: string, doFetch: BuscaCompativel = fetch): Promise<ResultadoDaConexao> {
  if (!cfg?.token || !cfg.projectId) return { ok: false, reason: "not_configured", message: NAO_CONFIGURADO };
  try {
    return await lerEstado(cfg, doFetch, domain, { added: false, recheck: true });
  } catch {
    return { ok: false, reason: "network", message: "Não foi possível falar com a Vercel agora. Tente de novo em instantes." };
  }
}
