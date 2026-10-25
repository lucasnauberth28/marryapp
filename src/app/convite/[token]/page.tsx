import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert } from "lucide-react";
import prisma from "@/lib/prisma";
import { obterSessao, ID_DO_SUPER_ADMIN } from "@/lib/security/auth-guard";
import { MoldeDeAcesso, FOTOS_DO_MOLDE, TituloDoMolde } from "@/components/account/auth-shell";
import { estiloDoBotao } from "@/components/landing/styles";
import { MENSAGEM_DA_SITUACAO_DO_CONVITE, buscarConvite } from "@/lib/account/invites";
import { classificarConta } from "@/lib/account/wedding-provisioning";
import { cn } from "@/lib/utils";
import { InviteAccept, type Viewer } from "./invite-accept";

export const metadata: Metadata = {
  title: "Convite",
  description: "Aceite o convite para organizar o casamento junto no Aceito.",
  robots: { index: false, follow: false },
  // O token está na URL: não deixa vazar no Referer de links externos.
  referrer: "no-referrer",
};

const TITLES = { invalid: "Convite não encontrado", expired: "Este convite expirou", used: "Este convite já foi usado" } as const;

export default async function ConvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const lookup = await buscarConvite(token);

  if (lookup.status !== "ok") {
    return (
      <MoldeDeAcesso photo={FOTOS_DO_MOLDE.convite}>
        <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
          <span className="grid size-14 place-items-center rounded-full bg-aviso-suave text-aviso">
            <CircleAlert aria-hidden="true" className="size-7" strokeWidth={1.6} />
          </span>
          <TituloDoMolde title={TITLES[lookup.status]} text={MENSAGEM_DA_SITUACAO_DO_CONVITE[lookup.status]} />
          <Link href="/login" className={cn(estiloDoBotao.primary, estiloDoBotao.block, "min-h-12")}>
            Entrar na minha conta
          </Link>
          <Link href="/" className={cn(estiloDoBotao.quiet, "self-center")}>
            Conhecer o Aceito
          </Link>
        </section>
      </MoldeDeAcesso>
    );
  }

  const session = await obterSessao();
  let viewer: Viewer = { kind: "anonymous" };
  if (session?.userId === ID_DO_SUPER_ADMIN) {
    viewer = { kind: "blocked", name: "Super Admin", reason: "A conta de emergência não pode entrar em um casamento." };
  } else if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        username: true,
        weddingId: true,
        partnerVendorId: true,
        role: { select: { name: true, allowedPaths: true } },
      },
    });
    if (user) {
      const kind = classificarConta(user);
      if (kind === "vendor") {
        viewer = { kind: "blocked", name: user.name, reason: "Você está numa conta de fornecedor. Para entrar no casamento, use uma conta pessoal." };
      } else if (kind === "admin") {
        viewer = { kind: "blocked", name: user.name, reason: "Contas da administração não entram em casamentos por convite." };
      } else {
        viewer = { kind: "member", name: user.name, email: user.username, alreadyIn: user.weddingId === lookup.invite.weddingId };
      }
    }
  }

  return (
    <MoldeDeAcesso photo={FOTOS_DO_MOLDE.convite} footnote="O convite vale por 7 dias e só pode ser usado uma vez.">
      <InviteAccept token={token} coupleNames={lookup.invite.coupleNames} viewer={viewer} />
    </MoldeDeAcesso>
  );
}
