// Onde o botão fixo da Liz aparece. Puro (sem Next): o layout do painel usa e os testes conferem.
// Lista de telas permitidas (e não de proibidas): uma tela nova de administração nunca ganha o botão sem querer.

/** Telas do painel do casal. Ficam de fora a administração da plataforma, as ferramentas antigas dela e as páginas públicas. */
export const CAMINHOS_DO_ATALHO_DA_LIZ = [
  "/dashboard",
  "/convidados",
  "/mensagens",
  "/mesas",
  "/credenciamento",
  "/pendencias",
  "/cronograma",
  "/meus-fornecedores",
  "/financas",
  "/carteira",
  "/site-builder",
  "/presentes-admin",
  "/dominio",
  "/configuracoes",
  "/plano",
  "/notificacoes",
] as const;

/** Verdadeiro nas telas do painel do casal. Compara por segmento: "/dominio" não libera "/dominios". */
export function deveMostrarOAtalhoDaLiz(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return CAMINHOS_DO_ATALHO_DA_LIZ.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
