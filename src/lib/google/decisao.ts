// O que fazer quando uma pessoa chega do Google. Puro: o banco é consultado por quem chama.
//  1. O identificador do Google (sub) já está vinculado a uma conta: entra nela.
//  2. Não está, mas existe conta com o mesmo e-mail (que o Google confirmou): vincula e entra.
//  3. Não existe nada: é cadastro novo (a pessoa completa tipo, WhatsApp e plano).
// A administração da plataforma nunca é vinculada: continua só com senha.

export interface ContaEncontrada {
  userId: string;
  /** Perfil com acesso total ("*"): a administração da plataforma. */
  ehAdministracao: boolean;
  /** Identificador do Google já vinculado a esta conta, se houver. */
  subJaVinculado: string | null;
}

export type DecisaoDaEntradaComGoogle =
  | { acao: "entrar"; userId: string }
  | { acao: "vincular"; userId: string }
  | { acao: "criar" }
  | { acao: "recusar"; motivo: "administracao" | "outro_google" };

export function decidirEntradaComGoogle(porSub: ContaEncontrada | null, porEmail: ContaEncontrada | null): DecisaoDaEntradaComGoogle {
  if (porSub) return porSub.ehAdministracao ? { acao: "recusar", motivo: "administracao" } : { acao: "entrar", userId: porSub.userId };
  if (!porEmail) return { acao: "criar" };
  if (porEmail.ehAdministracao) return { acao: "recusar", motivo: "administracao" };
  if (porEmail.subJaVinculado) return { acao: "recusar", motivo: "outro_google" };
  return { acao: "vincular", userId: porEmail.userId };
}
