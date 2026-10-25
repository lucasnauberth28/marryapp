// Sem dependências: usado no servidor e em componentes de cliente (cabeçalho, menu, barra lateral).

export interface EntradaDoRotuloDaConta {
  /** Conta de administração sem casamento próprio: o painel mostra o casamento principal. */
  adminView: boolean;
  coupleNames: string;
  coupleInitials: string;
  /** Nome do usuário (null na conta de emergência, que não tem cadastro). */
  userName?: string | null;
  /** Perfil de acesso (ex.: "Super Admin"). */
  role: string;
}

export interface RotuloDaConta {
  /** Título do topo e do cartão da barra lateral. */
  title: string;
  /** Iniciais do avatar. */
  initials: string;
  /** Primeira linha do menu do avatar. */
  menuTitle: string;
  /** Segunda linha do menu do avatar. */
  menuSubtitle: string;
}

/** Primeira letra do nome, em maiúscula ("maria silva" -> "M"). Vazio se não houver letra. */
export function iniciaisDaPessoa(name: string | null | undefined): string {
  const letter = (name ?? "").trim().match(/\p{L}/u)?.[0];
  return letter ? letter.toLocaleUpperCase("pt-BR") : "";
}

/**
 * O que o topo, a barra lateral e o menu do avatar mostram. Conta de casal: os nomes do casal.
 * Conta de administração sem casamento próprio: "Administração" (o casal que aparece nas telas
 * é só o casamento principal, mostrado à parte como contexto), com a inicial do usuário ou "AD".
 */
export function rotuloDaConta({ adminView, coupleNames, coupleInitials, userName, role }: EntradaDoRotuloDaConta): RotuloDaConta {
  if (!adminView) {
    return { title: coupleNames, initials: coupleInitials, menuTitle: coupleNames, menuSubtitle: role };
  }
  const name = userName?.trim() || "";
  return {
    title: "Administração",
    initials: iniciaisDaPessoa(name) || "AD",
    menuTitle: name || role,
    menuSubtitle: name ? role : "Conta de administração",
  };
}

// Páginas de administração e de conta: o casamento principal não é o assunto delas.
const CAMINHOS_FORA_DO_CASAMENTO = ["/curadoria", "/assinaturas", "/dominios", "/usuarios", "/perfis", "/atividades", "/conta", "/notificacoes"];

/**
 * Se a página mostra o aviso "Você está vendo o casamento principal": só para a administração
 * e só nas páginas que falam do casamento (Início, convidados, presentes...).
 */
export function mostraNotaDoCasamentoPrincipal(pathname: string): boolean {
  return !CAMINHOS_FORA_DO_CASAMENTO.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
