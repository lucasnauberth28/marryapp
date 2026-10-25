import "server-only";
import prisma from "@/lib/prisma";
import { exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { obterConfiguracaoDaPlataforma } from "@/lib/platform/settings";
import { CHAVES_DE_CONFIGURACAO_DA_MADRINHA, INSTRUCOES_PADRAO_DA_MADRINHA } from "@/lib/platform/madrinha";

/**
 * Consultas da Liz (configuração apenas: a IA não está conectada, então não há conversas, custos nem uso).
 * Cada função confere o acesso da administração por conta própria.
 */

export interface DadosDaConfiguracao {
  /** Já foi salvo pela administração? Se não, o valor mostrado é o padrão sugerido do código. */
  saved: boolean;
  updatedAt: Date | null;
  updatedByName: string | null;
}

/** Quais configurações da Liz já foram salvas de verdade (e por quem). */
export async function obterDadosDasConfiguracoesDaMadrinha(): Promise<Record<(typeof CHAVES_DE_CONFIGURACAO_DA_MADRINHA)[number], DadosDaConfiguracao>> {
  await exigirAdminDaPlataforma();
  const rows = await prisma.platformSetting.findMany({
    where: { key: { in: [...CHAVES_DE_CONFIGURACAO_DA_MADRINHA] } },
    select: { key: true, updatedAt: true, updatedByName: true },
  });
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const meta = (key: string): DadosDaConfiguracao => {
    const row = byKey.get(key);
    return { saved: Boolean(row), updatedAt: row?.updatedAt ?? null, updatedByName: row?.updatedByName ?? null };
  };
  return {
    "madrinha.limits": meta("madrinha.limits"),
    "madrinha.globalCap": meta("madrinha.globalCap"),
    "madrinha.abuse": meta("madrinha.abuse"),
    "madrinha.capabilities": meta("madrinha.capabilities"),
  };
}

export interface VisaoGeralDaMadrinha {
  limits: Awaited<ReturnType<typeof obterConfiguracaoDaPlataforma<"madrinha.limits">>>;
  globalCap: Awaited<ReturnType<typeof obterConfiguracaoDaPlataforma<"madrinha.globalCap">>>;
  abuse: Awaited<ReturnType<typeof obterConfiguracaoDaPlataforma<"madrinha.abuse">>>;
  meta: Awaited<ReturnType<typeof obterDadosDasConfiguracoesDaMadrinha>>;
  /** Última versão das instruções (ou null se ainda não existe nenhuma). */
  latestInstruction: { version: number; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" } | null;
  /** Só existe o texto inicial sugerido pelo Aceito (ninguém revisou ainda). */
  suggestedOnly: boolean;
  /** Nenhum texto salvo da base de conhecimento? */
  articleCount: number;
}

export async function obterVisaoGeralDaMadrinha(): Promise<VisaoGeralDaMadrinha> {
  await exigirAdminDaPlataforma();
  const [limits, globalCap, abuse, meta, latest, articleCount, versionCount] = await Promise.all([
    obterConfiguracaoDaPlataforma("madrinha.limits"),
    obterConfiguracaoDaPlataforma("madrinha.globalCap"),
    obterConfiguracaoDaPlataforma("madrinha.abuse"),
    obterDadosDasConfiguracoesDaMadrinha(),
    prisma.madrinhaInstructionVersion.findFirst({ orderBy: { version: "desc" }, select: { version: true, status: true } }),
    prisma.madrinhaKnowledgeArticle.count(),
    prisma.madrinhaInstructionVersion.count(),
  ]);
  const suggestedOnly = versionCount === 1 && latest?.version === 1 && latest.status === "DRAFT" && (await ehSementeSugerida());
  return { limits, globalCap, abuse, meta, latestInstruction: latest, suggestedOnly, articleCount };
}

async function ehSementeSugerida(): Promise<boolean> {
  const first = await prisma.madrinhaInstructionVersion.findUnique({ where: { version: 1 }, select: { createdById: true } });
  return first !== null && first.createdById === null; // a semente não tem autor; versão salva por uma pessoa tem
}

export interface LinhaDeExcecao {
  weddingId: string;
  coupleNames: string;
  slug: string;
  enabled: boolean | null;
  extraMessages: number;
  blockedAt: Date | null;
  blockedReason: string | null;
  note: string | null;
  updatedAt: Date;
}

/** Casais que têm algum ajuste (ligado/desligado à mão, mensagens a mais ou bloqueio). */
export async function listarExcecoesDaMadrinha(limit = 50): Promise<LinhaDeExcecao[]> {
  await exigirAdminDaPlataforma();
  const rows = await prisma.madrinhaWeddingOverride.findMany({
    where: { OR: [{ enabled: { not: null } }, { extraMessages: { gt: 0 } }, { blockedAt: { not: null } }] },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      weddingId: true,
      enabled: true,
      extraMessages: true,
      blockedAt: true,
      blockedReason: true,
      note: true,
      updatedAt: true,
      wedding: { select: { coupleNames: true, slug: true } },
    },
  });
  return rows.map((r) => ({
    weddingId: r.weddingId,
    coupleNames: r.wedding.coupleNames,
    slug: r.wedding.slug,
    enabled: r.enabled,
    extraMessages: r.extraMessages,
    blockedAt: r.blockedAt,
    blockedReason: r.blockedReason,
    note: r.note,
    updatedAt: r.updatedAt,
  }));
}

export interface ResultadoDeCasamento {
  id: string;
  coupleNames: string;
  slug: string;
  /** Ajuste atual deste casal, se houver. */
  override: { enabled: boolean | null; extraMessages: number; blocked: boolean; note: string | null } | null;
}

/** Busca de casais por nome ou endereço do site: consulta curta (até 8), nunca carrega todos. */
export async function buscarCasamentosParaAMadrinha(query: string): Promise<ResultadoDeCasamento[]> {
  await exigirAdminDaPlataforma();
  const q = query.trim().slice(0, 100);
  if (q.length < 2) return [];
  const rows = await prisma.wedding.findMany({
    where: { OR: [{ coupleNames: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }] },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { id: true, coupleNames: true, slug: true, madrinhaOverride: { select: { enabled: true, extraMessages: true, blockedAt: true, note: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    coupleNames: r.coupleNames,
    slug: r.slug,
    override: r.madrinhaOverride
      ? { enabled: r.madrinhaOverride.enabled, extraMessages: r.madrinhaOverride.extraMessages, blocked: r.madrinhaOverride.blockedAt !== null, note: r.madrinhaOverride.note }
      : null,
  }));
}

export interface LinhaDeVersaoDasInstrucoes {
  id: string;
  version: number;
  content: string;
  changeNote: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdByName: string | null;
  createdAt: Date;
  publishedAt: Date | null;
}

/**
 * Histórico de versões das instruções (da mais nova para a mais antiga). Se a tabela está vazia, grava a
 * primeira versão como rascunho com o texto inicial sugerido (idempotente: a versão 1 é única no banco).
 */
export async function listarVersoesDasInstrucoes(): Promise<LinhaDeVersaoDasInstrucoes[]> {
  await exigirAdminDaPlataforma();
  const select = { id: true, version: true, content: true, changeNote: true, status: true, createdByName: true, createdAt: true, publishedAt: true } as const;
  let rows = await prisma.madrinhaInstructionVersion.findMany({ orderBy: { version: "desc" }, take: 50, select });
  if (rows.length === 0) {
    await prisma.madrinhaInstructionVersion
      .createMany({
        data: [{ version: 1, content: INSTRUCOES_PADRAO_DA_MADRINHA, changeNote: "Texto inicial sugerido", status: "DRAFT", createdByName: "Sugestão do Aceito" }],
        skipDuplicates: true,
      })
      .catch((error) => console.error("[madrinha] semente das instruções:", error instanceof Error ? error.message : error));
    rows = await prisma.madrinhaInstructionVersion.findMany({ orderBy: { version: "desc" }, take: 50, select });
  }
  return rows;
}

export interface LinhaDeArtigo {
  id: string;
  title: string;
  content: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  updatedAt: Date;
  publishedAt: Date | null;
}

export async function listarArtigosDeConhecimento(): Promise<LinhaDeArtigo[]> {
  await exigirAdminDaPlataforma();
  return prisma.madrinhaKnowledgeArticle.findMany({
    where: { status: { not: "ARCHIVED" } },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: { id: true, title: true, content: true, status: true, updatedAt: true, publishedAt: true },
  });
}
