import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NOME_DO_COOKIE_DE_SESSAO } from "@/lib/auth";
import { caminhoSeguroDeRetorno } from "@/lib/login-redirect";
import { obterSessao } from "@/lib/security/auth-guard";
import { obterCatalogo } from "@/lib/catalog-server";
import { ExperienciaDeAcesso } from "./auth-experience";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre para continuar organizando o casamento no Aceito.",
};

type ParametrosDeBusca = Promise<Record<string, string | string[] | undefined>>;

const primeiroValor = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * `?proxima=/caminho` leva de volta a onde a pessoa estava (só caminho interno, validado) e
 * `?expirou=1` mostra o aviso de sessão expirada. O aviso também aparece quando o navegador
 * ainda traz um cookie de sessão que já não vale.
 */
export default async function LoginPage({ searchParams }: { searchParams: ParametrosDeBusca }) {
  const params = await searchParams;
  const nextPath = caminhoSeguroDeRetorno(primeiroValor(params.proxima));

  let expired = primeiroValor(params.expirou) === "1";
  if (!expired && (await cookies()).has(NOME_DO_COOKIE_DE_SESSAO)) {
    expired = (await obterSessao()) === null;
  }

  return <ExperienciaDeAcesso initialMode="entrar" nextPath={nextPath} sessionExpired={expired} catalog={await obterCatalogo()} />;
}
