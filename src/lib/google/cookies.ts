// Os dois cookies do fluxo do Google, assinados e de vida curta:
//  - "fluxo": o que a ida ao Google precisa lembrar na volta (state, nonce, verificador PKCE, para onde ir);
//  - "pendente": quem é a pessoa do Google que ainda não tem conta, enquanto ela completa o cadastro.
// Cada um tem a própria finalidade dentro do token: um não vale no lugar do outro.
import { SignJWT, jwtVerify } from "jose";

export type TipoDeConta = "casal" | "fornecedor";

export interface FluxoDoGoogle {
  state: string;
  nonce: string;
  verificador: string;
  /** "entrar" vem da tela de login; "criar", do cadastro. */
  modo: "entrar" | "criar";
  /** Caminho interno de volta (?proxima=), já validado. */
  proxima?: string;
  /** No cadastro: o que a pessoa já tinha escolhido antes de ir ao Google. */
  plano?: string;
  tipo?: TipoDeConta;
  /** No plano adaptado: os recursos que a pessoa tinha marcado. */
  modulos?: string[];
  /** Convite do par que a pessoa estava aceitando. */
  convite?: string;
}

export interface PerfilDoGoogle {
  sub: string;
  email: string;
  name: string;
}

type Finalidade = "google-fluxo" | "google-pendente";
export const DURACAO_DO_FLUXO_EM_SEGUNDOS = 10 * 60;
export const DURACAO_DO_PENDENTE_EM_SEGUNDOS = 30 * 60;

const chave = (segredo: string, finalidade: Finalidade) => new TextEncoder().encode(`${segredo}:${finalidade}`);

async function assinar(carga: object, finalidade: Finalidade, segredo: string, segundos: number): Promise<string> {
  const agora = Math.floor(Date.now() / 1000);
  return new SignJWT({ ...carga, fin: finalidade })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(agora)
    .setExpirationTime(agora + segundos)
    .sign(chave(segredo, finalidade));
}

async function ler(token: string | undefined, finalidade: Finalidade, segredo: string): Promise<Record<string, unknown> | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, chave(segredo, finalidade), { algorithms: ["HS256"] });
    return payload.fin === finalidade ? payload : null;
  } catch {
    return null;
  }
}

const texto = (v: unknown): string | undefined => (typeof v === "string" && v.length > 0 ? v : undefined);

export const assinarFluxo = (fluxo: FluxoDoGoogle, segredo: string) => assinar(fluxo, "google-fluxo", segredo, DURACAO_DO_FLUXO_EM_SEGUNDOS);

export async function lerFluxo(token: string | undefined, segredo: string): Promise<FluxoDoGoogle | null> {
  const p = await ler(token, "google-fluxo", segredo);
  const state = texto(p?.state), nonce = texto(p?.nonce), verificador = texto(p?.verificador);
  if (!p || !state || !nonce || !verificador || (p.modo !== "entrar" && p.modo !== "criar")) return null;
  const tipo = p.tipo === "casal" || p.tipo === "fornecedor" ? p.tipo : undefined;
  const modulos = Array.isArray(p.modulos) ? p.modulos.filter((m): m is string => typeof m === "string").slice(0, 20) : undefined;
  return { state, nonce, verificador, modo: p.modo, proxima: texto(p.proxima), plano: texto(p.plano), tipo, modulos, convite: texto(p.convite) };
}

export const assinarPerfilPendente = (perfil: PerfilDoGoogle, segredo: string) => assinar(perfil, "google-pendente", segredo, DURACAO_DO_PENDENTE_EM_SEGUNDOS);

export async function lerPerfilPendente(token: string | undefined, segredo: string): Promise<PerfilDoGoogle | null> {
  const p = await ler(token, "google-pendente", segredo);
  const sub = texto(p?.sub), email = texto(p?.email);
  return sub && email ? { sub, email, name: texto(p?.name) ?? "" } : null;
}
