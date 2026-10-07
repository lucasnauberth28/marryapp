// Sem dependências: usado tanto no servidor quanto em componentes de cliente (menu).

/**
 * Verifica se a lista de paths concede acesso ao path pedido.
 * Compara por segmento para que "/fornecedores" não libere "/fornecedores-admin".
 */
export function hasPathAccess(allowedPaths: string[], path: string): boolean {
  if (allowedPaths.includes("*")) return true;
  return allowedPaths.some((p) => path === p || path.startsWith(p.endsWith("/") ? p : `${p}/`));
}
