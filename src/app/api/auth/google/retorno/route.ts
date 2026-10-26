import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { urlDoApp } from "@/lib/app-url";
import { criarContaDoParComGoogle } from "@/lib/account/convite-com-google";
import { trocarCodigoPeloIdToken } from "@/lib/google/cliente";
import { assinarPerfilPendente, DURACAO_DO_PENDENTE_EM_SEGUNDOS, lerFluxo, type FluxoDoGoogle, type PerfilDoGoogle } from "@/lib/google/cookies";
import { RecusaDoGoogle, chavesDoGoogle, validarIdToken } from "@/lib/google/id-token";
import { abrirSessaoDaConta, COOKIE_DO_FLUXO_DO_GOOGLE, COOKIE_DO_PERFIL_PENDENTE, configuracaoAtualDoGoogle, decidirParaOPerfil, opcoesDosCookiesDoGoogle, segredoDoFluxoDoGoogle, vincularGoogleAConta } from "@/lib/google/servidor";
import { resolverCaminhoPosLogin } from "@/lib/painel/login-redirect";
import { limitarUsoPorIp } from "@/lib/security/rate-limiter";

export const dynamic = "force-dynamic";

const iguais = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Volta à tela de acesso com o motivo (a tela mostra o texto). */
function aoLoginComErro(codigo: string, modo?: "entrar" | "criar") {
  return NextResponse.redirect(urlDoApp(`${modo === "criar" ? "/cadastro" : "/login"}?erro=${codigo}`));
}

/** Conta nova: guarda quem é a pessoa por 30 minutos e leva ao passo de completar o cadastro. */
async function paraCompletarOCadastro(perfil: PerfilDoGoogle, fluxo: FluxoDoGoogle) {
  const consulta = new URLSearchParams({ google: "1" });
  if (fluxo.tipo) consulta.set("tipo", fluxo.tipo);
  if (fluxo.plano === "custom" && fluxo.modulos?.length) {
    consulta.set("custom", "true");
    consulta.set("modules", fluxo.modulos.join(","));
  } else if (fluxo.plano) consulta.set("plano", fluxo.plano);
  const resposta = NextResponse.redirect(urlDoApp(`/cadastro?${consulta}`));
  resposta.cookies.set(COOKIE_DO_PERFIL_PENDENTE, await assinarPerfilPendente(perfil, segredoDoFluxoDoGoogle()), opcoesDosCookiesDoGoogle(DURACAO_DO_PENDENTE_EM_SEGUNDOS));
  return resposta;
}

async function entrarNaConta(userId: string, fluxo: FluxoDoGoogle) {
  const sessao = await abrirSessaoDaConta(userId);
  if (!sessao) return aoLoginComErro("google-invalido", fluxo.modo);
  return NextResponse.redirect(urlDoApp(resolverCaminhoPosLogin(fluxo.proxima, sessao.destino, sessao.allowedPaths)));
}

/** Veio pelo convite do par e não tem conta: entra já no casamento. Se o convite não vale mais, a tela do convite explica. */
async function entrarPeloConvite(perfil: PerfilDoGoogle, fluxo: FluxoDoGoogle, convite: string) {
  const userId = await criarContaDoParComGoogle(perfil, convite);
  return userId ? entrarNaConta(userId, { ...fluxo, proxima: undefined }) : NextResponse.redirect(urlDoApp(`/convite/${convite}`));
}

/** O que o Google devolveu, já conferido: o perfil, ou o código do erro para a tela. */
async function perfilConferido(request: NextRequest, fluxo: FluxoDoGoogle): Promise<PerfilDoGoogle | { erro: string }> {
  const config = configuracaoAtualDoGoogle();
  const params = request.nextUrl.searchParams;
  const state = params.get("state"), codigo = params.get("code");
  if (!config || params.get("error") || !state || !codigo || !iguais(state, fluxo.state)) return { erro: params.get("error") === "access_denied" ? "google-cancelado" : "google-invalido" };
  const idToken = await trocarCodigoPeloIdToken(config, { codigo, verificador: fluxo.verificador }).catch(() => null);
  if (!idToken) return { erro: "google-invalido" };
  try {
    return await validarIdToken(idToken, { clientId: config.clientId, nonce: fluxo.nonce }, chavesDoGoogle(config.enderecos.chaves));
  } catch (error) {
    return { erro: error instanceof RecusaDoGoogle && error.motivo === "email_nao_verificado" ? "google-email" : "google-invalido" };
  }
}

/** A volta do Google: confere state, código, PKCE e id_token; depois entra, vincula à conta do mesmo e-mail ou pede o cadastro. */
export async function GET(request: NextRequest) {
  if (!configuracaoAtualDoGoogle()) return new NextResponse("Não encontrado", { status: 404 });
  const fluxo = await lerFluxo(request.cookies.get(COOKIE_DO_FLUXO_DO_GOOGLE)?.value, segredoDoFluxoDoGoogle());
  // O fluxo vale uma vez só: sai do navegador qualquer que seja o resultado
  const encerrar = (resposta: NextResponse) => (resposta.cookies.delete(COOKIE_DO_FLUXO_DO_GOOGLE), resposta);

  if (!fluxo) return encerrar(aoLoginComErro("google-invalido"));
  if (!(await limitarUsoPorIp("LOGIN")).success) return encerrar(aoLoginComErro("google-limite", fluxo.modo));

  const perfil = await perfilConferido(request, fluxo);
  if ("erro" in perfil) return encerrar(aoLoginComErro(perfil.erro, fluxo.modo));

  const decisao = await decidirParaOPerfil(perfil);
  if (decisao.acao === "recusar") return encerrar(aoLoginComErro(decisao.motivo === "administracao" ? "google-administracao" : "google-outra-conta", fluxo.modo));
  if (decisao.acao === "criar" && fluxo.convite) return encerrar(await entrarPeloConvite(perfil, fluxo, fluxo.convite));
  if (decisao.acao === "criar") return encerrar(await paraCompletarOCadastro(perfil, fluxo));
  if (decisao.acao === "vincular") await vincularGoogleAConta(decisao.userId, perfil);
  return encerrar(await entrarNaConta(decisao.userId, fluxo));
}
