// Fala com o Google: o endereço de autorização e a troca do código pelo id_token. `fetch` entra como parâmetro (testes usam um Google simulado).
import { desafioDoVerificador } from "./pkce.ts";

const ENDERECO_DE_AUTORIZACAO = "https://accounts.google.com/o/oauth2/v2/auth";
const ENDERECO_DO_TOKEN = "https://oauth2.googleapis.com/token";

export interface ConfiguracaoDoGoogle {
  clientId: string;
  clientSecret: string;
  /** Endereço de retorno cadastrado no Google Cloud. */
  redirectUri: string;
  enderecos: { autorizacao: string; token: string; chaves: string };
}

const ENDERECOS_DO_GOOGLE = { autorizacao: ENDERECO_DE_AUTORIZACAO, token: ENDERECO_DO_TOKEN, chaves: "https://www.googleapis.com/oauth2/v3/certs" };

/**
 * Os endereços do Google. Só um client id que começa com "simulado-" (nunca existe no Google) aceita trocá-los pelo Google
 * simulado dos testes (scripts/google-simulado.mjs), e só se ele estiver em localhost: em produção valem sempre os do Google.
 */
function enderecosPara(clientId: string, simulado: string | undefined) {
  if (!clientId.startsWith("simulado-") || !simulado || !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(simulado)) return ENDERECOS_DO_GOOGLE;
  return { autorizacao: `${simulado}/auth`, token: `${simulado}/token`, chaves: `${simulado}/certs` };
}

/** Sem as duas variáveis, o login com Google fica desligado (o botão some e as rotas respondem 404). */
export function configuracaoDoGoogle(env: Record<string, string | undefined>, origem: string): ConfiguracaoDoGoogle | null {
  const clientId = env.GOOGLE_CLIENT_ID?.trim(), clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret, redirectUri: `${origem.replace(/\/+$/, "")}/api/auth/google/retorno`, enderecos: enderecosPara(clientId, env.GOOGLE_SIMULADO_URL?.trim()) };
}

export function enderecoDeAutorizacao(config: ConfiguracaoDoGoogle, p: { state: string; nonce: string; verificador: string }): string {
  const url = new URL(config.enderecos.autorizacao);
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: p.state,
    nonce: p.nonce,
    code_challenge: desafioDoVerificador(p.verificador),
    code_challenge_method: "S256",
    // Sempre deixa a pessoa escolher a conta (quem tem várias não entra na errada sem ver)
    prompt: "select_account",
  }).toString();
  return url.toString();
}

/** Troca o código pelo id_token. Devolve null se o Google recusar (código vencido, repetido, verificador errado). */
export async function trocarCodigoPeloIdToken(config: ConfiguracaoDoGoogle, p: { codigo: string; verificador: string }, buscar: typeof fetch = fetch): Promise<string | null> {
  const resposta = await buscar(config.enderecos.token, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code: p.codigo, client_id: config.clientId, client_secret: config.clientSecret, redirect_uri: config.redirectUri, grant_type: "authorization_code", code_verifier: p.verificador }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!resposta.ok) return null;
  const corpo = (await resposta.json().catch(() => null)) as { id_token?: unknown } | null;
  return typeof corpo?.id_token === "string" ? corpo.id_token : null;
}
