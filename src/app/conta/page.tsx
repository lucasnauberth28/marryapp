import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import prisma from "@/lib/prisma";
import { Logo } from "@/components/brand/logo";
import { getSession, SUPER_ADMIN_USER_ID } from "@/lib/security/auth-guard";
import { classifyAccount } from "@/lib/account/wedding-provisioning";
import { AccountSections } from "./account-sections";

export const metadata: Metadata = {
  title: "Minha conta",
  description: "Senha, convite do par, seus dados e exclusão da conta.",
  robots: { index: false, follow: false },
};

const KIND_LABEL = { couple: "Conta de casal", vendor: "Conta de fornecedor", admin: "Conta da administração" } as const;

export default async function ContaPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.userId === SUPER_ADMIN_USER_ID) redirect("/dashboard");

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

  const kind = classifyAccount(user);
  const panelHref = kind === "vendor" ? "/fornecedor" : user.weddingId || kind === "admin" ? "/dashboard" : "/boas-vindas";

  return (
    <div className="min-h-dvh bg-linho text-tinta">
      <header className="sticky top-0 z-30 border-b border-linha bg-linho/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[880px] items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" aria-label="Aceito, início" className="-m-2 rounded-[12px] p-2 transition-opacity hover:opacity-80">
            <Logo height={24} priority />
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
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">{KIND_LABEL[kind]}</p>
          <h1 className="font-display text-[32px] leading-[38px] tracking-[-0.01em] text-balance md:text-[40px] md:leading-[46px]">Minha conta</h1>
          <p className="text-[15px] text-tinta-suave">
            {user.name} · {user.username}
          </p>
        </div>

        <AccountSections
          kind={kind}
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
