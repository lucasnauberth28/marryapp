/**
 * Endereço público do app para links enviados por e-mail.
 * Vem sempre da configuração (NEXT_PUBLIC_BASE_URL), nunca do header Host da requisição:
 * assim um atacante não consegue forjar o domínio de um link de redefinição de senha.
 */
export function urlBaseDoApp(): string {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.trim().replace(/\/+$/, "");
  if (configured && /^https?:\/\//.test(configured)) return configured;
  return process.env.NODE_ENV === "production" ? "https://meuaceito.com.br" : "http://localhost:3000";
}

export function urlDoApp(path: string): string {
  return `${urlBaseDoApp()}${path.startsWith("/") ? path : `/${path}`}`;
}
