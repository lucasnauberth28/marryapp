// Acesso (perfis e pessoas): ajuda das ações (não é ação).
import { ErroDeAutorizacao } from "@/lib/security/auth-guard";
import { temAcessoAoCaminho } from "@/lib/auth";

export function garantirQuePodeConceder(sessionPaths: string[], grantedPaths: unknown) {
  if (sessionPaths.includes("*")) return;
  const granted = Array.isArray(grantedPaths) ? (grantedPaths as string[]) : [];
  if (granted.some((p) => !temAcessoAoCaminho(sessionPaths, p))) {
    throw new ErroDeAutorizacao("Acesso negado: você não pode conceder permissões que não possui.");
  }
}
