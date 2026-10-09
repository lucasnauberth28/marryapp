import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert } from "lucide-react";
import prisma from "@/lib/prisma";
import { AuthShell, SHELL_PHOTOS, ShellHeading } from "@/components/account/auth-shell";
import { btn } from "@/components/landing/styles";
import { hashLinkToken, isLinkTokenShape } from "@/lib/account/tokens";
import { cn } from "@/lib/utils";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Nova senha",
  robots: { index: false, follow: false },
  // O token está na URL: não deixa vazar no Referer de links externos.
  referrer: "no-referrer",
};

export default async function RedefinirSenhaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let valid = false;
  if (isLinkTokenShape(token)) {
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashLinkToken(token) },
      select: { usedAt: true, expiresAt: true },
    });
    valid = Boolean(record && !record.usedAt && record.expiresAt > new Date());
  }

  return (
    <AuthShell photo={SHELL_PHOTOS.senha} backHref="/login" backLabel="Voltar para o login">
      {valid ? (
        <ResetPasswordForm token={token} />
      ) : (
        <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
          <span className="grid size-14 place-items-center rounded-full bg-aviso-suave text-aviso">
            <CircleAlert aria-hidden="true" className="size-7" strokeWidth={1.75} />
          </span>
          <ShellHeading title="Este link não vale mais" text="Ele expirou ou já foi usado. Peça um novo link: ele chega em instantes." />
          <Link href="/esqueci-a-senha" className={cn(btn.primary, btn.block, "min-h-12")}>
            Pedir um novo link
          </Link>
          <Link href="/login" className={cn(btn.quiet, "self-center")}>
            Voltar para o login
          </Link>
        </section>
      )}
    </AuthShell>
  );
}
