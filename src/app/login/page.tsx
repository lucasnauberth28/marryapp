import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { safeNextPath } from "@/lib/login-redirect";
import { getSession } from "@/lib/security/auth-guard";
import { AuthExperience } from "./auth-experience";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre para continuar organizando o casamento no Aceito.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * `?proxima=/caminho` leva de volta a onde a pessoa estava (só caminho interno, validado) e
 * `?expirou=1` mostra o aviso de sessão expirada. O aviso também aparece quando o navegador
 * ainda traz um cookie de sessão que já não vale.
 */
export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const nextPath = safeNextPath(first(params.proxima));

  let expired = first(params.expirou) === "1";
  if (!expired && (await cookies()).has(SESSION_COOKIE_NAME)) {
    expired = (await getSession()) === null;
  }

  return <AuthExperience initialMode="entrar" nextPath={nextPath} sessionExpired={expired} />;
}
