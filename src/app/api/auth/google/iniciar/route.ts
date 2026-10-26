import { NextResponse, type NextRequest } from "next/server";
import { urlDoApp } from "@/lib/app-url";
import { enderecoDeAutorizacao } from "@/lib/google/cliente";
import { assinarFluxo, DURACAO_DO_FLUXO_EM_SEGUNDOS, type FluxoDoGoogle } from "@/lib/google/cookies";
import { valorAleatorio } from "@/lib/google/pkce";
import { COOKIE_DO_FLUXO_DO_GOOGLE, configuracaoAtualDoGoogle, opcoesDosCookiesDoGoogle, segredoDoFluxoDoGoogle } from "@/lib/google/servidor";
import { caminhoSeguroDeRetorno } from "@/lib/painel/login-redirect";
import { limitarUsoPorIp } from "@/lib/security/rate-limiter";

export const dynamic = "force-dynamic";

const PADRAO_DO_PLANO = /^[a-z]{3,10}$/;
const PADRAO_DO_MODULO = /^[a-zA-Z0-9_-]{1,40}$/;
const PADRAO_DO_CONVITE = /^[A-Za-z0-9_-]{16,128}$/;

/** O que a tela mandou: só o que passa na validação entra no cookie (nada do que vem da URL é usado como está). */
function pedidoDaTela(params: URLSearchParams): Pick<FluxoDoGoogle, "modo" | "proxima" | "plano" | "tipo" | "modulos" | "convite"> {
  const plano = params.get("plano")?.toLowerCase() ?? "";
  const tipo = params.get("tipo");
  const convite = params.get("convite") ?? "";
  const modulos = (params.get("modulos") ?? "").split(",").filter((m) => PADRAO_DO_MODULO.test(m)).slice(0, 20);
  return {
    modo: params.get("modo") === "criar" ? "criar" : "entrar",
    proxima: caminhoSeguroDeRetorno(params.get("proxima")) ?? undefined,
    plano: PADRAO_DO_PLANO.test(plano) ? plano : undefined,
    tipo: tipo === "casal" || tipo === "fornecedor" ? tipo : undefined,
    modulos: modulos.length > 0 ? modulos : undefined,
    convite: PADRAO_DO_CONVITE.test(convite) ? convite : undefined,
  };
}

/** Começa a entrada com o Google: guarda state, nonce e verificador PKCE num cookie assinado e leva a pessoa ao Google. */
export async function GET(request: NextRequest) {
  const config = configuracaoAtualDoGoogle();
  if (!config) return new NextResponse("Não encontrado", { status: 404 });
  if (!(await limitarUsoPorIp("LOGIN")).success) return NextResponse.redirect(urlDoApp("/login?erro=google-limite"));

  const fluxo: FluxoDoGoogle = { state: valorAleatorio(), nonce: valorAleatorio(), verificador: valorAleatorio(48), ...pedidoDaTela(request.nextUrl.searchParams) };
  const resposta = NextResponse.redirect(enderecoDeAutorizacao(config, fluxo));
  resposta.cookies.set(COOKIE_DO_FLUXO_DO_GOOGLE, await assinarFluxo(fluxo, segredoDoFluxoDoGoogle()), opcoesDosCookiesDoGoogle(DURACAO_DO_FLUXO_EM_SEGUNDOS));
  return resposta;
}
