import type { Metadata } from "next";
import { ExperienciaDeAcesso } from "@/app/login/auth-experience";
import type { TipoDeConta } from "@/app/login/auth-config";
import { cookies } from "next/headers";
import { obterCatalogo } from "@/lib/pagamento/catalog-server";
import { lerPerfilPendente } from "@/lib/google/cookies";
import { mensagemDoErroDoGoogle } from "@/lib/google/mensagens";
import { COOKIE_DO_PERFIL_PENDENTE, configuracaoAtualDoGoogle, segredoDoFluxoDoGoogle } from "@/lib/google/servidor";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Criem a conta do casamento no Aceito. Fornecedores também podem cadastrar o negócio.",
};

type ParametrosDeBusca = Promise<Record<string, string | string[] | undefined>>;

const primeiroValor = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Quem acabou de voltar do Google (?google=1) e ainda não tem conta: o perfil confirmado vem do cookie assinado, nunca da URL. */
async function perfilDoGoogleDaVolta(params: Record<string, string | string[] | undefined>) {
  if (primeiroValor(params.google) !== "1") return null;
  const perfil = await lerPerfilPendente((await cookies()).get(COOKIE_DO_PERFIL_PENDENTE)?.value, segredoDoFluxoDoGoogle());
  return perfil ? { name: perfil.name, email: perfil.email } : null;
}

/** Aceita ?tipo=casal|fornecedor, ?plano=classic e o plano adaptado (?custom=true&modules=a,b). */
export default async function CadastroPage({ searchParams }: { searchParams: ParametrosDeBusca }) {
  const params = await searchParams;
  const tipo = primeiroValor(params.tipo);
  const type: TipoDeConta | null = tipo === "casal" || tipo === "fornecedor" ? tipo : null;
  const isCustom = primeiroValor(params.custom) === "true";
  const modules = isCustom
    ? (primeiroValor(params.modules) ?? "")
        .split(",")
        .map((m) => m.trim())
        .filter((m) => /^[a-zA-Z0-9_-]{1,40}$/.test(m))
        .slice(0, 20)
    : undefined;
  const plano = isCustom ? "custom" : primeiroValor(params.plano)?.toLowerCase();
  const perfilDoGoogle = await perfilDoGoogleDaVolta(params);
  // Voltou do Google mas o cookie venceu (mais de 30 minutos): pede para tentar de novo
  const erro = primeiroValor(params.erro) ?? (primeiroValor(params.google) === "1" && !perfilDoGoogle ? "google-invalido" : undefined);

  return (
    <ExperienciaDeAcesso
      initialMode="criar"
      initialType={isCustom ? "casal" : type}
      initialPlanId={plano}
      customModules={modules}
      catalog={await obterCatalogo()}
      googleAtivo={configuracaoAtualDoGoogle() !== null}
      erroDoGoogle={mensagemDoErroDoGoogle(erro)}
      perfilDoGoogle={perfilDoGoogle}
    />
  );
}
