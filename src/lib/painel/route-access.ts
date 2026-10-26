// Mapa das rotas do app para o proxy: sem dependências (roda no proxy e nos testes).
// Cada pasta de primeiro nível em src/app precisa estar em uma das listas. O teste
// route-access.test.ts confere isso olhando as pastas, então uma rota nova sem lista falha no CI.

/** Acessíveis sem login. */
const CAMINHOS_PUBLICOS = [
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
  "/api/auth", // entrada com o Google: cada rota confere state, nonce e PKCE
  "/api/cron", // autenticada pelo CRON_SECRET na própria rota
  "/api/manutencao", // aviso de manutenção para convidados (só mostra ligado, mensagem e hora de volta)
  "/convite", // aceitar o convite do par
  "/esqueci-a-senha",
  "/redefinir-senha",
  "/confirmar-email",
  "/termos",
  "/privacidade",
  "/proposta", // casal aceita a proposta do fornecedor pelo link
  "/avaliar", // casal avalia o fornecedor pelo link do pedido fechado
  "/mapa-das-mesas", // mesas em 3D só para ver, pelo link que o casal compartilha
];

/**
 * Rotas de qualquer conta logada, sem depender de módulo do perfil: o onboarding do casamento,
 * a área "Minha conta", os recibos (a própria página confere a quem pertencem) e os avisos.
 */
const CAMINHOS_DE_SESSAO = ["/boas-vindas", "/conta", "/recibo", "/notificacoes"];

/** Painel do casal, painel do fornecedor e rotas de API da conta: exigem sessão e módulo liberado. */
const CAMINHOS_PROTEGIDOS = [
  // Administração da plataforma: só a conta com acesso total ("*"); cada página, Server Action e rota
  // de API confere de novo com requirePlatformAdmin (lib/security/platform-admin.ts).
  "/admin",
  "/dashboard",
  "/assinaturas",
  "/atividades",
  "/carteira",
  "/configuracoes",
  "/convidados",
  "/credenciamento",
  "/cronograma",
  "/curadoria",
  "/dominio",
  "/dominios",
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
  "/api/admin",
  "/api/conta",
  "/api/export",
];

export type TipoDeRota = "public" | "session" | "protected" | "unknown";

function combinaComCaminho(list: string[], path: string) {
  return list.some((p) => path === p || path.startsWith(`${p}/`));
}

/** Diz a que grupo um caminho pertence. "unknown" é um caminho que não existe no app (vira 404). */
export function classificarCaminho(path: string): TipoDeRota {
  if (path === "/") return "public";
  if (combinaComCaminho(CAMINHOS_PUBLICOS, path)) return "public";
  if (combinaComCaminho(CAMINHOS_DE_SESSAO, path)) return "session";
  if (combinaComCaminho(CAMINHOS_PROTEGIDOS, path)) return "protected";
  return "unknown";
}

export function ehCaminhoDeSessao(path: string) {
  return combinaComCaminho(CAMINHOS_DE_SESSAO, path);
}

/** Caminho da administração da plataforma (/admin e abaixo dele; a API fica em /api/admin). */
export function ehCaminhoDeAdminDaPlataforma(path: string) {
  return path === "/admin" || path.startsWith("/admin/");
}
