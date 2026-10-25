// Sem dependências: usado tanto no servidor quanto em componentes de cliente (menu).

/**
 * Verifica se a lista de paths concede acesso ao path pedido.
 * Compara por segmento para que "/fornecedores" não libere "/fornecedores-admin".
 */
export function temAcessoAoCaminho(allowedPaths: string[], path: string): boolean {
  if (allowedPaths.includes("*")) return true;
  return allowedPaths.some((p) => path === p || path.startsWith(p.endsWith("/") ? p : `${p}/`));
}

/**
 * Administração da plataforma (o dono do Aceito): só a conta com acesso total ("*").
 * Uma lista com "/admin" escrito NÃO basta: o /admin atravessa todos os casamentos de propósito.
 */
export function ehAcessoDeAdminDaPlataforma(allowedPaths: readonly string[] | null | undefined): boolean {
  return Array.isArray(allowedPaths) && allowedPaths.includes("*");
}
