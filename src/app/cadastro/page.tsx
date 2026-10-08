import type { Metadata } from "next";
import { AuthExperience } from "@/app/login/auth-experience";
import type { AccountType } from "@/app/login/auth-config";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Criem a conta do casamento no Aceito ou cadastre seu negócio na vitrine de fornecedores.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Aceita ?tipo=casal|fornecedor, ?plano=classic e o plano adaptado (?custom=true&modules=a,b). */
export default async function CadastroPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const tipo = first(params.tipo);
  const type: AccountType | null = tipo === "casal" || tipo === "fornecedor" ? tipo : null;
  const isCustom = first(params.custom) === "true";
  const modules = isCustom
    ? (first(params.modules) ?? "")
        .split(",")
        .map((m) => m.trim())
        .filter((m) => /^[a-zA-Z0-9_-]{1,40}$/.test(m))
        .slice(0, 20)
    : undefined;
  const plano = isCustom ? "custom" : first(params.plano)?.toLowerCase();

  return (
    <AuthExperience
      initialMode="criar"
      initialType={isCustom ? "casal" : type}
      initialPlanId={plano}
      customModules={modules}
    />
  );
}
