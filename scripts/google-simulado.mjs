// Google simulado, só para os testes e2e: autorização, troca do código (confere o PKCE) e chaves públicas.
// Quem "está logado no Google" vem do cookie `google_simulado` (JSON em base64url: { sub, email, name, verificado });
// o cookie `google_simulado_cancelar` simula quem desiste na tela do Google. O app só fala com este servidor
// quando o client id começa com "simulado-" e GOOGLE_SIMULADO_URL é localhost (ver src/lib/google/cliente.ts).
import { createServer } from "node:http";
import { createHash, randomBytes } from "node:crypto";
import { SignJWT, exportJWK, generateKeyPair } from "jose";

const PORTA = Number(process.env.GOOGLE_SIMULADO_PORTA ?? 4010);
const { publicKey, privateKey } = await generateKeyPair("RS256");
const jwk = { ...(await exportJWK(publicKey)), kid: "simulado-1", alg: "RS256", use: "sig" };
const codigos = new Map();

const cookies = (req) => Object.fromEntries((req.headers.cookie ?? "").split(/;\s*/).filter(Boolean).map((c) => [c.slice(0, c.indexOf("=")), c.slice(c.indexOf("=") + 1)]));
const responder = (res, status, corpo, tipo = "application/json") => (res.writeHead(status, { "content-type": tipo }), res.end(typeof corpo === "string" ? corpo : JSON.stringify(corpo)));

function autorizar(req, res, url) {
  const q = url.searchParams, c = cookies(req);
  const volta = new URL(q.get("redirect_uri") ?? "");
  volta.searchParams.set("state", q.get("state") ?? "");
  if (c.google_simulado_cancelar) volta.searchParams.set("error", "access_denied");
  else if (!c.google_simulado) return responder(res, 400, "Sem perfil simulado", "text/plain");
  else {
    const codigo = randomBytes(16).toString("hex");
    codigos.set(codigo, { perfil: JSON.parse(Buffer.from(c.google_simulado, "base64url").toString()), desafio: q.get("code_challenge"), nonce: q.get("nonce"), clientId: q.get("client_id"), redirectUri: q.get("redirect_uri") });
    volta.searchParams.set("code", codigo);
  }
  res.writeHead(302, { location: volta.toString() }).end();
}

async function trocar(req, res) {
  let corpo = "";
  for await (const parte of req) corpo += parte;
  const p = new URLSearchParams(corpo);
  const guardado = codigos.get(p.get("code") ?? "");
  codigos.delete(p.get("code") ?? ""); // o código vale uma vez só
  const verificador = createHash("sha256").update(p.get("code_verifier") ?? "").digest("base64url");
  if (!guardado || guardado.desafio !== verificador || guardado.clientId !== p.get("client_id") || guardado.redirectUri !== p.get("redirect_uri")) return responder(res, 400, { error: "invalid_grant" });
  const { sub, email, name, verificado = true } = guardado.perfil;
  const idToken = await new SignJWT({ email, email_verified: verificado, name, nonce: guardado.nonce })
    .setProtectedHeader({ alg: "RS256", kid: jwk.kid })
    .setIssuer("https://accounts.google.com").setAudience(guardado.clientId).setSubject(sub)
    .setIssuedAt().setExpirationTime("10m").sign(privateKey);
  responder(res, 200, { id_token: idToken, access_token: "simulado", token_type: "Bearer" });
}

createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORTA}`);
  if (url.pathname === "/auth") return autorizar(req, res, url);
  if (url.pathname === "/token" && req.method === "POST") return trocar(req, res).catch(() => responder(res, 500, { error: "erro" }));
  if (url.pathname === "/certs") return responder(res, 200, { keys: [jwk] });
  responder(res, 200, "ok", "text/plain"); // verificação de saúde do Playwright
}).listen(PORTA, () => console.log(`Google simulado em http://localhost:${PORTA}`));
