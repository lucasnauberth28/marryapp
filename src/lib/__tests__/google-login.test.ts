import { test } from "node:test";
import assert from "node:assert/strict";
import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from "jose";
import { desafioDoVerificador, valorAleatorio } from "../google/pkce.ts";
import { assinarFluxo, assinarPerfilPendente, lerFluxo, lerPerfilPendente, type FluxoDoGoogle } from "../google/cookies.ts";
import { RecusaDoGoogle, validarIdToken } from "../google/id-token.ts";
import { decidirEntradaComGoogle, type ContaEncontrada } from "../google/decisao.ts";
import { configuracaoDoGoogle, enderecoDeAutorizacao, trocarCodigoPeloIdToken } from "../google/cliente.ts";

const SEGREDO = "segredo-de-teste-com-mais-de-32-letras!!";

test("PKCE: o desafio segue o exemplo da RFC 7636 e os valores aleatórios não se repetem", () => {
  assert.equal(desafioDoVerificador("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"), "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  assert.notEqual(valorAleatorio(), valorAleatorio());
  assert.match(valorAleatorio(), /^[A-Za-z0-9_-]{43}$/);
});

const fluxo: FluxoDoGoogle = { state: "s1", nonce: "n1", verificador: "v1", modo: "criar", proxima: "/dashboard", plano: "classic", tipo: "casal" };

test("o cookie do fluxo volta igual; outro segredo, outra finalidade ou adulteração não valem", async () => {
  const token = await assinarFluxo(fluxo, SEGREDO);
  assert.deepEqual(await lerFluxo(token, SEGREDO), { ...fluxo, modulos: undefined, convite: undefined });
  assert.equal(await lerFluxo(token, SEGREDO + "x"), null);
  assert.equal(await lerFluxo(token.slice(0, -3) + "abc", SEGREDO), null);
  assert.equal(await lerFluxo(undefined, SEGREDO), null);
  // o cookie do perfil pendente não serve de cookie de fluxo
  const pendente = await assinarPerfilPendente({ sub: "1", email: "a@b.com", name: "Ana" }, SEGREDO);
  assert.equal(await lerFluxo(pendente, SEGREDO), null);
  assert.equal(await lerPerfilPendente(token, SEGREDO), null);
  assert.deepEqual(await lerPerfilPendente(pendente, SEGREDO), { sub: "1", email: "a@b.com", name: "Ana" });
});

test("tipo de conta desconhecido no cookie é ignorado", async () => {
  const token = await assinarFluxo({ ...fluxo, tipo: "admin" as never }, SEGREDO);
  assert.equal((await lerFluxo(token, SEGREDO))?.tipo, undefined);
});

async function googleSimulado() {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const jwk = { ...(await exportJWK(publicKey)), alg: "RS256", use: "sig", kid: "k1" };
  const chaves = createLocalJWKSet({ keys: [jwk] });
  const emitir = (campos: Record<string, unknown>, opcoes: { iss?: string; aud?: string; exp?: string } = {}) =>
    new SignJWT({ nonce: "n1", email: "Ana@Gmail.com", email_verified: true, name: "Ana Souza", ...campos })
      .setProtectedHeader({ alg: "RS256", kid: "k1" })
      .setSubject("google-sub-1")
      .setIssuer(opcoes.iss ?? "https://accounts.google.com")
      .setAudience(opcoes.aud ?? "meu-client-id")
      .setIssuedAt()
      .setExpirationTime(opcoes.exp ?? "5m")
      .sign(privateKey);
  return { chaves, emitir };
}

const CONFIG_BASE = configuracaoDoGoogle({ GOOGLE_CLIENT_ID: "cid", GOOGLE_CLIENT_SECRET: "sec" }, "https://x.test") as NonNullable<ReturnType<typeof configuracaoDoGoogle>>;
const esperado = { clientId: "meu-client-id", nonce: "n1" };
const motivo = async (p: Promise<unknown>) => p.then(() => "aceito", (e) => (e instanceof RecusaDoGoogle ? e.motivo : "erro"));

test("id_token válido devolve o perfil, com o e-mail em minúsculas", async () => {
  const { chaves, emitir } = await googleSimulado();
  assert.deepEqual(await validarIdToken(await emitir({}), esperado, chaves), { sub: "google-sub-1", email: "ana@gmail.com", name: "Ana Souza" });
});

test("id_token recusado: outro destinatário, outro emissor, vencido, outro nonce, e-mail não verificado", async () => {
  const { chaves, emitir } = await googleSimulado();
  assert.equal(await motivo(validarIdToken(await emitir({}, { aud: "outro-app" }), esperado, chaves)), "token_invalido");
  assert.equal(await motivo(validarIdToken(await emitir({}, { iss: "https://falso.example" }), esperado, chaves)), "token_invalido");
  assert.equal(await motivo(validarIdToken(await emitir({}, { exp: "-1m" }), esperado, chaves)), "token_invalido");
  assert.equal(await motivo(validarIdToken(await emitir({ nonce: "outro" }), esperado, chaves)), "nonce");
  assert.equal(await motivo(validarIdToken(await emitir({ email_verified: false }), esperado, chaves)), "email_nao_verificado");
  assert.equal(await motivo(validarIdToken(await emitir({ email_verified: "true" }), esperado, chaves)), "email_nao_verificado");
  assert.equal(await motivo(validarIdToken("isto-nao-e-um-token", esperado, chaves)), "token_invalido");
});

test("id_token assinado por outra chave não vale", async () => {
  const { emitir } = await googleSimulado();
  const outras = (await googleSimulado()).chaves;
  assert.equal(await motivo(validarIdToken(await emitir({}), esperado, outras)), "token_invalido");
});

const conta = (o: Partial<ContaEncontrada> = {}): ContaEncontrada => ({ userId: "u1", ehAdministracao: false, subJaVinculado: null, ...o });

test("decisão: entra por sub, vincula por e-mail, cria quando não há nada", () => {
  assert.deepEqual(decidirEntradaComGoogle(conta({ subJaVinculado: "x" }), null), { acao: "entrar", userId: "u1" });
  assert.deepEqual(decidirEntradaComGoogle(null, conta()), { acao: "vincular", userId: "u1" });
  assert.deepEqual(decidirEntradaComGoogle(null, null), { acao: "criar" });
});

test("decisão: administração nunca é vinculada nem entra pelo Google; e-mail já ligado a outro Google é recusado", () => {
  assert.deepEqual(decidirEntradaComGoogle(null, conta({ ehAdministracao: true })), { acao: "recusar", motivo: "administracao" });
  assert.deepEqual(decidirEntradaComGoogle(conta({ ehAdministracao: true }), null), { acao: "recusar", motivo: "administracao" });
  assert.deepEqual(decidirEntradaComGoogle(null, conta({ subJaVinculado: "outro" })), { acao: "recusar", motivo: "outro_google" });
});

test("configuração: sem as variáveis o Google fica desligado; o retorno usa a origem do app", () => {
  assert.equal(configuracaoDoGoogle({}, "https://meuaceito.com.br"), null);
  assert.equal(configuracaoDoGoogle({ GOOGLE_CLIENT_ID: "a" }, "https://meuaceito.com.br"), null);
  const real = configuracaoDoGoogle({ GOOGLE_CLIENT_ID: " a ", GOOGLE_CLIENT_SECRET: "b" }, "https://meuaceito.com.br/");
  assert.equal(real?.clientId, "a");
  assert.equal(real?.redirectUri, "https://meuaceito.com.br/api/auth/google/retorno");
  assert.equal(real?.enderecos.autorizacao, "https://accounts.google.com/o/oauth2/v2/auth");
  assert.equal(real?.enderecos.chaves, "https://www.googleapis.com/oauth2/v3/certs");
});

test("endereço de autorização leva state, nonce, PKCE S256 e só os escopos básicos", () => {
  const config = { ...CONFIG_BASE, redirectUri: "https://x.test/api/auth/google/retorno" };
  const url = new URL(enderecoDeAutorizacao(config, { state: "st", nonce: "no", verificador: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk" }));
  assert.equal(url.origin + url.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
  assert.equal(url.searchParams.get("scope"), "openid email profile");
  assert.equal(url.searchParams.get("state"), "st");
  assert.equal(url.searchParams.get("nonce"), "no");
  assert.equal(url.searchParams.get("code_challenge"), "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("client_secret"), null);
});

test("troca do código: manda o verificador e devolve o id_token; recusa do Google vira null", async () => {
  const config = { ...CONFIG_BASE, redirectUri: "https://x.test/r" };
  let corpo = "";
  const bom = (async (_url: string | URL | Request, init?: RequestInit) => {
    corpo = String(init?.body);
    return new Response(JSON.stringify({ id_token: "abc.def.ghi" }), { status: 200 });
  }) as typeof fetch;
  assert.equal(await trocarCodigoPeloIdToken(config, { codigo: "cod", verificador: "ver" }, bom), "abc.def.ghi");
  assert.match(corpo, /code_verifier=ver/);
  assert.match(corpo, /grant_type=authorization_code/);
  const recusa = (async () => new Response("{}", { status: 400 })) as typeof fetch;
  assert.equal(await trocarCodigoPeloIdToken(config, { codigo: "cod", verificador: "ver" }, recusa), null);
  const semToken = (async () => new Response("{}", { status: 200 })) as typeof fetch;
  assert.equal(await trocarCodigoPeloIdToken(config, { codigo: "cod", verificador: "ver" }, semToken), null);
});

test("só um client id 'simulado-' aceita o Google simulado, e só em localhost", () => {
  const env = (id: string, url: string) => ({ GOOGLE_CLIENT_ID: id, GOOGLE_CLIENT_SECRET: "s", GOOGLE_SIMULADO_URL: url });
  assert.equal(configuracaoDoGoogle(env("simulado-aceito", "http://localhost:4010"), "http://localhost:3000")?.enderecos.token, "http://localhost:4010/token");
  // client id de verdade (ou qualquer outro): o endereço simulado é ignorado
  assert.equal(configuracaoDoGoogle(env("123.apps.googleusercontent.com", "http://localhost:4010"), "https://meuaceito.com.br")?.enderecos.token, "https://oauth2.googleapis.com/token");
  // fora de localhost: ignorado até para o client id simulado
  assert.equal(configuracaoDoGoogle(env("simulado-aceito", "https://atacante.example"), "https://meuaceito.com.br")?.enderecos.token, "https://oauth2.googleapis.com/token");
  assert.equal(configuracaoDoGoogle(env("simulado-aceito", "http://localhost.atacante.example"), "https://meuaceito.com.br")?.enderecos.token, "https://oauth2.googleapis.com/token");
});
