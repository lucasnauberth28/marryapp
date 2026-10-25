import prisma from "@/lib/prisma";
import { exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { normalizarBusca, digitosDoTelefone } from "@/lib/platform/support";

/**
 * Consultas de Suporte e LGPD. Atravessam casamentos de propósito (é o dono), mas o select nunca inclui
 * senha, tokens, chaves nem documento (CPF/CNPJ) de ninguém.
 */

interface ResultadoDaBusca {
  kind: "wedding" | "user" | "vendor";
  id: string;
  title: string;
  detail: string;
  /** Para onde o resultado leva (null = sem tela para abrir, ex.: conta da equipe). */
  href: string | null;
  /** Para "Abrir um pedido de ajuda" a partir do resultado. */
  ticketHref: string | null;
}

export interface ResultadosDaBusca {
  query: string;
  hits: ResultadoDaBusca[];
}

const POR_TIPO = 8;

const TICKET_DO_CASAL = (id: string) => `/admin/suporte?novo=1&casal=${id}#chamados`;
const TICKET_DO_FORNECEDOR = (id: string) => `/admin/suporte?novo=1&fornecedor=${id}#chamados`;

/** Os três tipos de resultado, cada um com até 8 itens. */
async function buscarOsTresTipos(q: string) {
  const digits = digitosDoTelefone(q);
  const ci = { contains: q, mode: "insensitive" as const };
  return Promise.all([
    prisma.wedding.findMany({
      where: { OR: [{ coupleNames: ci }, { slug: ci }, { customDomain: ci }] },
      orderBy: { createdAt: "desc" },
      take: POR_TIPO,
      select: { id: true, coupleNames: true, slug: true, customDomain: true, suspendedAt: true },
    }),
    prisma.user.findMany({
      where: { OR: [{ name: ci }, { username: ci }] },
      orderBy: { createdAt: "desc" },
      take: POR_TIPO,
      select: { id: true, name: true, username: true, weddingId: true, partnerVendorId: true, role: { select: { allowedPaths: true } } },
    }),
    prisma.partnerVendor.findMany({
      where: { OR: [{ companyName: ci }, ...(digits ? [{ phone: { contains: digits } }, { whatsapp: { contains: digits } }] : []), { phone: ci }, { whatsapp: ci }] },
      orderBy: { createdAt: "desc" },
      take: POR_TIPO,
      select: { id: true, companyName: true, category: true, suspendedAt: true },
    }),
  ]);
}

type Casamentos = Awaited<ReturnType<typeof buscarOsTresTipos>>[0];
type Usuarios = Awaited<ReturnType<typeof buscarOsTresTipos>>[1];
type Fornecedores = Awaited<ReturnType<typeof buscarOsTresTipos>>[2];

function resultadoDoUsuario(u: Usuarios[number]): ResultadoDaBusca {
  const isStaff = Array.isArray(u.role.allowedPaths) && (u.role.allowedPaths as string[]).includes("*");
  return {
    kind: "user",
    id: u.id,
    title: u.name,
    detail: `${u.partnerVendorId ? "Conta de fornecedor" : u.weddingId ? "Conta de casal" : isStaff ? "Equipe" : "Conta"} · ${u.username}`,
    href: u.weddingId ? `/admin/casais/${u.weddingId}` : u.partnerVendorId ? `/admin/fornecedores?id=${u.partnerVendorId}` : null,
    ticketHref: u.weddingId ? TICKET_DO_CASAL(u.weddingId) : u.partnerVendorId ? TICKET_DO_FORNECEDOR(u.partnerVendorId) : null,
  };
}

function resultadosDaBusca(weddings: Casamentos, users: Usuarios, vendors: Fornecedores): ResultadoDaBusca[] {
  return [
    ...weddings.map((w): ResultadoDaBusca => ({
      kind: "wedding",
      id: w.id,
      title: w.coupleNames,
      detail: `Casal · ${w.customDomain ?? w.slug}${w.suspendedAt ? " · suspenso" : ""}`,
      href: `/admin/casais/${w.id}`,
      ticketHref: TICKET_DO_CASAL(w.id),
    })),
    ...users.map(resultadoDoUsuario),
    ...vendors.map((v): ResultadoDaBusca => ({
      kind: "vendor",
      id: v.id,
      title: v.companyName,
      detail: `Fornecedor · ${v.category}${v.suspendedAt ? " · suspenso" : ""}`,
      href: `/admin/fornecedores?id=${v.id}`,
      ticketHref: TICKET_DO_FORNECEDOR(v.id),
    })),
  ];
}

/** Busca em tudo: casal (nome, endereço do site, domínio), pessoa (nome, e-mail) e fornecedor (nome, telefone). Até 8 por tipo. */
export async function buscarEmTudo(raw: string | undefined): Promise<ResultadosDaBusca | null> {
  await exigirAdminDaPlataforma();
  const q = normalizarBusca(raw);
  if (!q) return null;
  const [weddings, users, vendors] = await buscarOsTresTipos(q);
  return { query: q, hits: resultadosDaBusca(weddings, users, vendors) };
}
