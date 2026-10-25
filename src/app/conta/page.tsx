import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import prisma from "@/lib/prisma";
import { Logotipo } from "@/components/brand/logo";
import { obterSessao, ID_DO_SUPER_ADMIN, redirecionarParaOLogin } from "@/lib/security/auth-guard";
import { classificarConta } from "@/lib/account/wedding-provisioning";
import { gruposPara } from "@/lib/notifications/catalog";
import { resolverPreferencias } from "@/lib/notifications/preferences";
import { chavePublicaVapid } from "@/lib/notifications/push";
import { SecoesDaConta } from "./account-sections";

export const metadata: Metadata = {
  title: "Minha conta",
  description: "Senha, convite do par, seus dados e exclusão da conta.",
  robots: { index: false, follow: false },
};

const ROTULO_DO_TIPO = { couple: "Conta de casal", vendor: "Conta de fornecedor", admin: "Conta da administração" } as const;

export default async function ContaPage() {
  const session = await obterSessao();
  if (!session) return redirecionarParaOLogin();
  if (session.userId === ID_DO_SUPER_ADMIN) redirect("/admin");

  const now = new Date();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      username: true,
      createdAt: true,
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
  if (!user) redirect("/login");
  const storedPrefs = await prisma.notificationPreference.findUnique({ where: { userId: user.id }, select: { settings: true } });

  const kind = classificarConta(user);
  const kindIsVendor = kind === "vendor";
  const panelHref = kind === "vendor" ? "/fornecedor" : user.weddingId ? "/dashboard" : kind === "admin" ? (session.allowedPaths.includes("*") ? "/admin" : "/dashboard") : "/boas-vindas";

  return (
    <div className="min-h-dvh bg-linho text-tinta">
      <header className="sticky top-0 z-30 border-b border-linha bg-linho/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[880px] items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" aria-label="Aceito, início" className="-m-2 rounded-[12px] p-2 transition-opacity hover:opacity-80">
            <Logotipo height={26} priority />
          </Link>
          <Link
            href={panelHref}
            className="inline-flex min-h-11 items-center gap-2 rounded-[12px] px-3 text-[15px] font-semibold text-ameixa transition-colors hover:bg-ameixa-suave"
          >
            <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={2} />
            Voltar ao painel
          </Link>
        </div>
      </header>

      <main id="conteudo" className="page-in mx-auto flex w-full max-w-[880px] flex-col gap-8 px-4 pb-16 pt-8 sm:px-6 md:pt-12">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">{ROTULO_DO_TIPO[kind]}</p>
          <h1 className="font-display text-[32px] leading-[38px] tracking-[-0.01em] text-balance md:text-[40px] md:leading-[46px]">Minha conta</h1>
          <p className="text-[15px] text-tinta-suave">
            {user.name} · {user.username}
          </p>
        </div>

        <SecoesDaConta
          kind={kind}
          pushPublicKey={chavePublicaVapid()}
          notifications={{
            prefs: resolverPreferencias(storedPrefs?.settings),
            audience: kindIsVendor ? "vendor" : "couple",
            groups: gruposPara(kindIsVendor ? "vendor" : "couple"),
          }}
          account={{
            name: user.name,
            email: user.username,
            createdAt: user.createdAt.toISOString(),
            companyName: user.partnerVendor?.companyName ?? null,
          }}
          wedding={
            kind === "couple" && user.wedding
              ? {
                  coupleNames: user.wedding.coupleNames,
                  slug: user.wedding.slug,
                  members: user.wedding.members.map((m) => ({
                    id: m.id,
                    name: m.name,
                    email: m.username,
                    isYou: m.id === user.id,
                    since: m.createdAt.toISOString(),
                  })),
                  invites: user.wedding.invites.map((i) => ({
                    id: i.id,
                    email: i.email,
                    createdAt: i.createdAt.toISOString(),
                    expiresAt: i.expiresAt.toISOString(),
                  })),
                }
              : null
          }
        />
      </main>
    </div>
  );
}
