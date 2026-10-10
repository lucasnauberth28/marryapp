// Mapa das rotas do app para o proxy: sem dependências (roda no proxy e nos testes).
// Cada pasta de primeiro nível em src/app precisa estar em uma das listas. O teste
// route-access.test.ts confere isso olhando as pastas, então uma rota nova sem lista falha no CI.

/** Acessíveis sem login. */
export const PUBLIC_PATHS = [
  "/login",
  "/cadastro",
  "/assinar",
  "/casamento",
  "/fornecedores",
  "/monte-seu-plano",
  "/planos",
  "/presentes",
  "/checkout",
  "/rsvp",
  "/dia-do-evento",
  "/api/webhooks",
  "/api/cron", // autenticada pelo CRON_SECRET na própria rota
  "/convite", // aceitar o convite do par
  "/esqueci-a-senha",
  "/redefinir-senha",
  "/termos",
  "/privacidade",
  "/proposta", // casal aceita a proposta do fornecedor pelo link
  "/avaliar", // casal avalia o fornecedor pelo link do pedido fechado
];

/**
 * Rotas de qualquer conta logada, sem depender de módulo do perfil: o onboarding do casamento,
 * a área "Minha conta", os recibos (a própria página confere a quem pertencem) e os avisos.
 */
export const SESSION_PATHS = ["/boas-vindas", "/conta", "/recibo", "/notificacoes"];

/** Painel do casal, painel do fornecedor e rotas de API da conta: exigem sessão e módulo liberado. */
export const PROTECTED_PATHS = [
  "/dashboard",
  "/assinaturas",
  "/atividades",
  "/carteira",
  "/configuracoes",
  "/convidados",
  "/credenciamento",
  "/cronograma",
  "/curadoria",
  "/financas",
  "/mensagens",
  "/mesas",
  "/meus-fornecedores",
  "/pendencias",
  "/perfis",
  "/plano",
  "/presentes-admin",
  "/site-builder",
  "/usuarios",
  "/fornecedor",
  "/api/conta",
  "/api/export",
];

export type RouteKind = "public" | "session" | "protected" | "unknown";

function matches(list: string[], path: string) {
  return list.some((p) => path === p || path.startsWith(`${p}/`));
}

/** Diz a que grupo um caminho pertence. "unknown" é um caminho que não existe no app (vira 404). */
export function classifyPath(path: string): RouteKind {
  if (path === "/") return "public";
  if (matches(PUBLIC_PATHS, path)) return "public";
  if (matches(SESSION_PATHS, path)) return "session";
  if (matches(PROTECTED_PATHS, path)) return "protected";
  return "unknown";
}

export function isSessionPath(path: string) {
  return matches(SESSION_PATHS, path);
}
