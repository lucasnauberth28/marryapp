// O que a página Minha conta precisa: a pessoa, o casamento e os avisos, já em texto simples para o navegador.
import prisma from "@/lib/prisma";
import { classificarConta } from "@/lib/account/wedding-provisioning";
import { gruposPara } from "@/lib/notifications/catalog";
import { resolverPreferencias } from "@/lib/notifications/preferences";
import type { CasamentoDaConta, Propriedades } from "./secoes/tipos";

export function buscarPessoaDaConta(userId: string, now: Date) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      hasPassword: true,
      emailVerifiedAt: true,
      createdAt: true,
      externalAccounts: { where: { provider: "google" }, select: { email: true, createdAt: true } },
      weddingId: true,
      partnerVendorId: true,
      role: { select: { name: true, allowedPaths: true } },
      partnerVendor: { select: { companyName: true } },
      wedding: {
        select: {
          coupleNames: true,
          slug: true,
          members: { select: { id: true, name: true, username: true, createdAt: true }, orderBy: { createdAt: "asc" } },
          invites: {
            where: { usedAt: null, expiresAt: { gt: now } },
            select: { id: true, email: true, createdAt: true, expiresAt: true },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });
}

type PessoaDaConta = NonNullable<Awaited<ReturnType<typeof buscarPessoaDaConta>>>;

function casamentoDaConta(user: PessoaDaConta): CasamentoDaConta | null {
  if (!user.wedding) return null;
  return {
    coupleNames: user.wedding.coupleNames,
    slug: user.wedding.slug,
    members: user.wedding.members.map((m) => ({ id: m.id, name: m.name, email: m.username, isYou: m.id === user.id, since: m.createdAt.toISOString() })),
    invites: user.wedding.invites.map((i) => ({ id: i.id, email: i.email, createdAt: i.createdAt.toISOString(), expiresAt: i.expiresAt.toISOString() })),
  };
}

export async function propriedadesDaConta(user: PessoaDaConta, pushPublicKey: string | null): Promise<{ kind: ReturnType<typeof classificarConta>; props: Propriedades }> {
  const storedPrefs = await prisma.notificationPreference.findUnique({ where: { userId: user.id }, select: { settings: true } });
  const kind = classificarConta(user);
  const publico = kind === "vendor" ? "vendor" : "couple";
  return {
    kind,
    props: {
      kind,
      pushPublicKey,
      notifications: { prefs: resolverPreferencias(storedPrefs?.settings), audience: publico, groups: gruposPara(publico) },
      account: { name: user.name, email: user.username, createdAt: user.createdAt.toISOString(), companyName: user.partnerVendor?.companyName ?? null, hasPassword: user.hasPassword, emailVerified: user.emailVerifiedAt !== null },
      google: user.externalAccounts[0] ? { email: user.externalAccounts[0].email, since: user.externalAccounts[0].createdAt.toISOString() } : null,
      wedding: kind === "couple" ? casamentoDaConta(user) : null,
    },
  };
}

/** Para onde o "Voltar ao painel" leva, conforme o tipo de conta. */
export function destinoDoPainel(kind: ReturnType<typeof classificarConta>, user: Pick<PessoaDaConta, "weddingId">, allowedPaths: string[]) {
  if (kind === "vendor") return "/fornecedor";
  if (user.weddingId) return "/dashboard";
  if (kind === "admin") return allowedPaths.includes("*") ? "/admin" : "/dashboard";
  return "/boas-vindas";
}
