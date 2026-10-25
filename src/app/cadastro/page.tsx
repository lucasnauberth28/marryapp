import type { Metadata } from "next";
import { ExperienciaDeAcesso } from "@/app/login/auth-experience";
import type { TipoDeConta } from "@/app/login/auth-config";
import { obterCatalogo } from "@/lib/pagamento/catalog-server";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Criem a conta do casamento no Aceito. Fornecedores também podem cadastrar o negócio.",
};

type ParametrosDeBusca = Promise<Record<string, string | string[] | undefined>>;

const primeiroValor = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

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

  return (
    <ExperienciaDeAcesso
      initialMode="criar"
      initialType={isCustom ? "casal" : type}
      initialPlanId={plano}
      customModules={modules}
      catalog={await obterCatalogo()}
    />
  );
}
