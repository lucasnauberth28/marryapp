import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert } from "lucide-react";
import prisma from "@/lib/prisma";
import { obterSessao, ID_DO_SUPER_ADMIN } from "@/lib/security/auth-guard";
import { MoldeDeAcesso, FOTOS_DO_MOLDE, TituloDoMolde } from "@/components/account/auth-shell";
import { estiloDoBotao } from "@/components/landing/styles";
import { MENSAGEM_DA_SITUACAO_DO_CONVITE, buscarConvite } from "@/lib/account/invites";
import { classificarConta } from "@/lib/account/wedding-provisioning";
import { configuracaoAtualDoGoogle } from "@/lib/google/servidor";
import { cn } from "@/lib/utils";
import { AceiteDoConvite, type Visitante } from "./invite-accept";

export const metadata: Metadata = {
  title: "Convite",
  description: "Aceite o convite para organizar o casamento junto no Aceito.",
  robots: { index: false, follow: false },
  // O token está na URL: não deixa vazar no Referer de links externos.
  referrer: "no-referrer",
};

const TITULOS = { invalid: "Convite não encontrado", expired: "Este convite expirou", used: "Este convite já foi usado" } as const;

function ConviteIndisponivel({ status }: { status: keyof typeof TITULOS }) {
  return (
    <MoldeDeAcesso photo={FOTOS_DO_MOLDE.convite}>
      <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
        <span className="grid size-14 place-items-center rounded-full bg-aviso-suave text-aviso">
          <CircleAlert aria-hidden="true" className="size-7" strokeWidth={1.6} />
        </span>
        <TituloDoMolde title={TITULOS[status]} text={MENSAGEM_DA_SITUACAO_DO_CONVITE[status]} />
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

/** Quem está abrindo o convite: sem login, conta que pode entrar, ou conta que não pode (admin/fornecedor). */
async function identificarVisitante(weddingId: string): Promise<Visitante> {
  const session = await obterSessao();
  if (!session) return { kind: "anonymous" };
  if (session.userId === ID_DO_SUPER_ADMIN) return { kind: "blocked", name: "Super Admin", reason: "A conta de emergência não pode entrar em um casamento." };
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, username: true, weddingId: true, partnerVendorId: true, role: { select: { name: true, allowedPaths: true } } },
  });
  if (!user) return { kind: "anonymous" };
  const kind = classificarConta(user);
  if (kind === "vendor") return { kind: "blocked", name: user.name, reason: "Você está numa conta de fornecedor. Para entrar no casamento, use uma conta pessoal." };
  if (kind === "admin") return { kind: "blocked", name: user.name, reason: "Contas da administração não entram em casamentos por convite." };
  return { kind: "member", name: user.name, email: user.username, alreadyIn: user.weddingId === weddingId };
}

export default async function ConvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const lookup = await buscarConvite(token);

  if (lookup.status !== "ok") {
    return <ConviteIndisponivel status={lookup.status} />;
  }

  const viewer = await identificarVisitante(lookup.invite.weddingId);

  return (
    <MoldeDeAcesso photo={FOTOS_DO_MOLDE.convite} footnote="O convite vale por 7 dias e só pode ser usado uma vez.">
      <AceiteDoConvite token={token} coupleNames={lookup.invite.coupleNames} viewer={viewer} googleAtivo={configuracaoAtualDoGoogle() !== null} />
    </MoldeDeAcesso>
  );
}
