import type { Metadata } from "next";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { obterSessao, ID_DO_SUPER_ADMIN, redirecionarParaOLogin } from "@/lib/security/auth-guard";
import { classificarConta } from "@/lib/account/wedding-provisioning";
import { separarNomesDoCasal } from "@/lib/painel/onboarding-options";
import { FluxoDeBoasVindas } from "./onboarding-flow";

export const metadata: Metadata = {
  title: "Boas-vindas",
  description: "Os nomes e a data do casamento para o Aceito abrir o site de vocês.",
  robots: { index: false, follow: false },
};

const TEMPO_DE_RECEM_CONCLUIDO_EM_MS = 30 * 60 * 1000;

function concluiuHaPouco(onboardedAt: Date | null | undefined) {
  return onboardedAt ? Date.now() - onboardedAt.getTime() < TEMPO_DE_RECEM_CONCLUIDO_EM_MS : false;
}

/** "2027-10-11" no fuso de Brasília. */
function paraCampoDeData(date: Date | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export default async function BoasVindasPage() {
  const session = await obterSessao();
  if (!session) return redirecionarParaOLogin();
  if (session.userId === ID_DO_SUPER_ADMIN) redirect("/admin");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      partnerVendorId: true,
      role: { select: { name: true, allowedPaths: true } },
      wedding: {
        select: { slug: true, coupleNames: true, weddingDate: true, onboardedAt: true },
      },
    },
  });
  if (!user) redirect("/login");

  const kind = classificarConta(user);
  if (kind === "vendor") redirect("/fornecedor");
  // Concluir o onboarding grava a sessão nova, e isso recarrega esta página: logo depois de concluir
  // ela mostra a tela "pronto" (endereço do site e primeiros passos) em vez de pular para o painel.
  const onboardedAt = user.wedding?.onboardedAt;
  const justFinished = concluiuHaPouco(onboardedAt);
  if (onboardedAt && !justFinished) redirect("/dashboard");
  if (kind === "admin" && !user.wedding) redirect(session.allowedPaths.includes("*") ? "/admin" : "/dashboard");

  const firstName = user.name.trim().split(/\s+/)[0] ?? "";
  // No cadastro o casamento nasce com o nome de quem criou a conta; o par entra aqui.
  const [a, b] = user.wedding ? separarNomesDoCasal(user.wedding.coupleNames) : [firstName, ""];
  const yourName = b ? a : firstName || a;
  const partnerName = b;

  return (
    <FluxoDeBoasVindas
      firstName={firstName}
      done={justFinished && user.wedding ? { slug: user.wedding.slug, coupleNames: user.wedding.coupleNames } : null}
      initial={{
        yourName,
        partnerName,
        weddingDate: paraCampoDeData(user.wedding?.weddingDate ?? null),
      }}
    />
  );
}
