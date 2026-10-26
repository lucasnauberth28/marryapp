import { temAcessoAoCaminho } from "@/lib/auth";
import { ehAcessoDeAdminDaPlataforma } from "@/lib/permissions";
import { INICIO_DO_ADMIN_DA_PLATAFORMA } from "@/lib/painel/login-redirect";
import { classificarConta } from "@/lib/account/wedding-provisioning";

/**
 * Destino após o login (por senha ou pelo Google): a administração (/admin) para a conta com acesso total ("*"); o painel
 * do fornecedor para contas de fornecedor; o onboarding (/boas-vindas) para contas de casal ainda sem casamento; senão o painel do casal.
 */
export function caminhoDeChegadaPara(user: { id: string; weddingId: string | null; partnerVendorId: string | null; role: { name: string; allowedPaths: unknown } }) {
  const allowedPaths = Array.isArray(user.role.allowedPaths) ? (user.role.allowedPaths as string[]) : [];
  if (ehAcessoDeAdminDaPlataforma(allowedPaths)) return INICIO_DO_ADMIN_DA_PLATAFORMA;
  const kind = classificarConta(user);
  if (kind === "vendor") return temAcessoAoCaminho(allowedPaths, "/fornecedor") ? "/fornecedor" : "/dashboard";
  if (kind === "couple" && !user.weddingId) return "/boas-vindas";
  if (temAcessoAoCaminho(allowedPaths, "/dashboard")) return "/dashboard";
  if (temAcessoAoCaminho(allowedPaths, "/fornecedor")) return "/fornecedor";
  return "/dashboard";
}
