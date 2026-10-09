// Regras puras do casamento (sem banco), usadas pelo cadastro, onboarding e convites.

/** Perfil de acesso das contas de casal (o casal e o par convidado). */
export const COUPLE_ROLE_NAME = "Casal";

/**
 * Módulos do painel liberados para o casal. Ficam de fora os da plataforma
 * (/curadoria, /assinaturas, /usuarios, /perfis), que são da administração do Aceito.
 */
export const COUPLE_PATHS = [
  "/dashboard",
  "/convidados",
  "/mensagens",
  "/mesas",
  "/credenciamento",
  "/pendencias",
  "/cronograma",
  "/meus-fornecedores",
  "/fornecedores",
  "/financas",
  "/carteira",
  "/site-builder",
  "/presentes-admin",
  "/configuracoes",
  "/plano",
] as const;

/** "Ana & Rafael" → "ana-e-rafael" (sem acentos, só letras, números e hífen). */
export function slugifyCoupleNames(names: string): string {
  const base = names
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&|\+/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return base || "casamento";
}
