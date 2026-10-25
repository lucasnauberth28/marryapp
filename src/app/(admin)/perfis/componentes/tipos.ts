export const MODULOS_DISPONIVEIS = [
  { id: "*", name: "Acesso total" },
  { id: "/dashboard", name: "Início do painel" },
  { id: "/credenciamento", name: "Registro de entrada dos convidados" },
  { id: "/convidados", name: "Lista de convidados" },
  { id: "/mesas", name: "Mesas" },
  { id: "/cronograma", name: "Cronograma do dia" },
  { id: "/fornecedores", name: "Encontrar fornecedores" },
  { id: "/meus-fornecedores", name: "Meus fornecedores" },
  { id: "/mensagens", name: "Mensagens" },
  { id: "/financas", name: "Finanças" },
  { id: "/carteira", name: "Carteira" },
  { id: "/despesas", name: "Despesas" },
  { id: "/presentes-admin", name: "Presentes em dinheiro" },
  { id: "/lua-de-mel", name: "Cotas de lua de mel" },
  { id: "/pendencias", name: "Tarefas" },
  { id: "/site-builder", name: "Editar o site" },
  { id: "/plano", name: "Plano e pagamentos do casal" },
  { id: "/dominio", name: "Endereço personalizado do site" },
  { id: "/configuracoes", name: "Configurações" },
  { id: "/usuarios", name: "Usuários" },
  { id: "/perfis", name: "Perfis de acesso" },
  { id: "/curadoria", name: "Curadoria de fornecedores (plataforma)" },
  { id: "/assinaturas", name: "Assinaturas e pagamentos (plataforma)" },
  { id: "/fornecedor", name: "Painel do fornecedor" },
];

export interface ItemDePerfil {
  id: string;
  name: string;
  allowedPaths: unknown; // coluna Json: array de paths
  _count?: { users: number };
}

export interface DadosDoPerfil {
  name: string;
  allowedPaths: string[];
}

export function paraCaminhos(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((p): p is string => typeof p === "string") : [];
}

export const nomeDoModulo = (path: string) => MODULOS_DISPONIVEIS.find((m) => m.id === path)?.name || path;

export function rotuloDeUsuarios(role: ItemDePerfil) {
  const n = role._count?.users || 0;
  return `${n} ${n === 1 ? "usuário" : "usuários"}`;
}

/** Marca ou desmarca uma área. "Acesso total" é sozinho: marcá-lo limpa as outras, e marcar outra o tira. */
export function alternarCaminho(atuais: string[], path: string): string[] {
  if (path === "*") return atuais.includes("*") ? [] : ["*"];
  return atuais.includes(path) ? atuais.filter((p) => p !== path) : [...atuais.filter((p) => p !== "*"), path];
}
