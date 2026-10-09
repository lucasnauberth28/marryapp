import type { Metadata } from "next";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession, SUPER_ADMIN_USER_ID } from "@/lib/security/auth-guard";
import { classifyAccount } from "@/lib/account/wedding-provisioning";
import { DEFAULT_THEME_COLOR, GUEST_RANGES, THEME_PRESETS, splitCoupleNames, type GuestRange } from "@/lib/onboarding-options";
import { OnboardingFlow } from "./onboarding-flow";

export const metadata: Metadata = {
  title: "Boas-vindas",
  description: "Contem um pouco sobre o casamento para o Aceito preparar tudo.",
  robots: { index: false, follow: false },
};

const JUST_FINISHED_MS = 30 * 60 * 1000;

function finishedRecently(onboardedAt: Date | null | undefined) {
  return onboardedAt ? Date.now() - onboardedAt.getTime() < JUST_FINISHED_MS : false;
}

/** "2027-10-11" no fuso de Brasília. */
function toDateInput(date: Date | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export default async function BoasVindasPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.userId === SUPER_ADMIN_USER_ID) redirect("/dashboard");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      partnerVendorId: true,
      role: { select: { name: true, allowedPaths: true } },
      wedding: {
        select: { slug: true, coupleNames: true, weddingDate: true, city: true, guestEstimate: true, themeColor: true, onboardedAt: true },
      },
    },
  });
  if (!user) redirect("/login");

  const kind = classifyAccount(user);
  if (kind === "vendor") redirect("/fornecedor");
  // Concluir o onboarding grava a sessão nova, e isso recarrega esta página: logo depois de concluir
  // ela mostra a tela "pronto" (endereço do site e primeiros passos) em vez de pular para o painel.
  const onboardedAt = user.wedding?.onboardedAt;
  const justFinished = finishedRecently(onboardedAt);
  if (onboardedAt && !justFinished) redirect("/dashboard");
  if (kind === "admin" && !user.wedding) redirect("/dashboard");

  const firstName = user.name.trim().split(/\s+/)[0] ?? "";
  // No cadastro o casamento nasce com o nome de quem criou a conta; o par entra aqui.
  const [a, b] = user.wedding ? splitCoupleNames(user.wedding.coupleNames) : [firstName, ""];
  const yourName = b ? a : firstName || a;
  const partnerName = b;

  const guestEstimate = (GUEST_RANGES as readonly string[]).includes(user.wedding?.guestEstimate ?? "")
    ? (user.wedding?.guestEstimate as GuestRange)
    : null;
  const themeColor = THEME_PRESETS.some((p) => p.hex === user.wedding?.themeColor) ? user.wedding!.themeColor : DEFAULT_THEME_COLOR;

  return (
    <OnboardingFlow
      firstName={firstName}
      done={justFinished && user.wedding ? { slug: user.wedding.slug, coupleNames: user.wedding.coupleNames } : null}
      initial={{
        yourName,
        partnerName,
        weddingDate: toDateInput(user.wedding?.weddingDate ?? null),
        city: user.wedding?.city ?? "",
        guestEstimate,
        themeColor,
      }}
    />
  );
}
