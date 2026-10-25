// Registro de atividades (AuditLog) em português: frase de cada ação, grupo para o filtro por tipo e resumo dos detalhes.
// Sem banco nem Next: roda nos testes. Ação nova que ainda não tem frase aparece pelo código (nunca some).
import { formatarReais } from "../formatacao/dinheiro.ts";
import { ROTULO_DA_ACAO, ROTULO_DA_CONFIGURACAO, ROTULO_DO_ALVO, ROTULO_DO_DETALHE } from "./activity-labels.ts";

/** Frase da ação (ou o código, se ainda não houver frase). */
export function rotuloDaAcao(action: string): string {
  return ROTULO_DA_ACAO[action] ?? action;
}

export function rotuloDoAlvo(targetType: string | null | undefined): string | null {
  return targetType ? (ROTULO_DO_ALVO[targetType] ?? targetType) : null;
}

/** Grupos do filtro "Tipo": cada um reúne ações pelo prefixo do código. */
export const GRUPOS_DE_ATIVIDADE = [
  { value: "casais", label: "Casais", prefixes: ["wedding.", "impersonation.", "guests."] },
  { value: "fornecedores", label: "Fornecedores", prefixes: ["vendor.", "review."] },
  { value: "dinheiro", label: "Planos e receita", prefixes: ["subscription.", "coupon.", "catalog.", "refund.", "invoice.", "export."] },
  { value: "dominios", label: "Domínios", prefixes: ["domain."] },
  { value: "acesso", label: "Usuários, perfis e contas", prefixes: ["user.", "role.", "account."] },
  { value: "madrinha", label: "Liz", prefixes: ["madrinha."] },
  { value: "comunicados", label: "Comunicados", prefixes: ["announcement."] },
  { value: "suporte", label: "Suporte e LGPD", prefixes: ["ticket.", "data_request.", "incident.", "support."] },
  { value: "sistema", label: "Sistema", prefixes: ["platform_setting.", "maintenance.", "health.", "whatsapp."] },
] as const;

export type ValorDoGrupoDeAtividade = (typeof GRUPOS_DE_ATIVIDADE)[number]["value"];
export const VALORES_DOS_GRUPOS_DE_ATIVIDADE = GRUPOS_DE_ATIVIDADE.map((g) => g.value) as readonly ValorDoGrupoDeAtividade[];

/** Prefixos de ação de um grupo (vazio se o grupo não existe). */
export function prefixosDoGrupo(group: string | undefined): readonly string[] {
  return GRUPOS_DE_ATIVIDADE.find((g) => g.value === group)?.prefixes ?? [];
}

/** Grupo de uma ação (null se não pertence a nenhum). */
export function grupoDe(action: string): ValorDoGrupoDeAtividade | null {
  return GRUPOS_DE_ATIVIDADE.find((g) => g.prefixes.some((p) => action.startsWith(p)))?.value ?? null;
}

/** "?alvo=wedding:<id>" -> { type, id }; recusa o que não for tipo seguro e id curto. */
export function interpretarAlvo(value: string | undefined): { type: string; id: string } | null {
  if (!value) return null;
  const match = value.match(/^([A-Za-z_]{2,40}):([A-Za-z0-9_-]{1,100})$/);
  return match ? { type: match[1], id: match[2] } : null;
}


/** Resumo curto dos detalhes: só chaves conhecidas e valores simples, no máximo cinco. Nunca mostra o que não está na lista. */
export function resumirDetalhes(details: unknown, action?: string, targetId?: string | null): string {
  const parts: string[] = [];
  if (action === "platform_setting.update" && targetId) parts.push(`Configuração: ${ROTULO_DA_CONFIGURACAO[targetId] ?? targetId}`);
  if (details && typeof details === "object" && !Array.isArray(details)) {
    for (const [key, value] of Object.entries(details as Record<string, unknown>)) {
      const label = ROTULO_DO_DETALHE[key];
      if (!label || value === null || value === "" || value === undefined) continue;
      if (typeof value === "boolean") parts.push(`${label}: ${value ? "sim" : "não"}`);
      else if (key === "amount" && typeof value === "number") parts.push(`${label}: ${formatarReais(value).replace(/\s/g, " ")}`);
      else if (Array.isArray(value) && value.every((v) => typeof v === "string")) parts.push(`${label}: ${value.join(", ")}`);
      else if (typeof value === "string" || typeof value === "number") parts.push(`${label}: ${String(value).slice(0, 120)}`);
      if (parts.length >= 5) break;
    }
  }
  return parts.slice(0, 5).join(" · ");
}

/** Para onde o alvo leva na administração (null = sem tela). */
export function linkDoAlvo(targetType: string | null | undefined, targetId: string | null | undefined): string | null {
  if (!targetType || !targetId) return null;
  if ((targetType === "wedding" || targetType === "Wedding") && /^[0-9a-f-]{36}$/i.test(targetId)) return `/admin/casais/${targetId}`;
  if (targetType === "partner_vendor" && /^[0-9a-f-]{36}$/i.test(targetId)) return `/admin/fornecedores?id=${targetId}`;
  return null;
}
