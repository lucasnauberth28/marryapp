import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, Clock } from "lucide-react";
import prisma from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";
import { TOKEN_OVERLINE, TokenPageShell } from "@/components/public/token-page-shell";
import { formatWeddingDate, PUBLIC_TOKEN_RE } from "@/app/(fornecedor)/_lib/vendor-panel";
import { ReviewForm } from "./review-form";

export const metadata: Metadata = {
  title: "Avaliar fornecedor",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const VIEW_LIMIT = { limit: 60, windowMs: 1000 * 60 * 10 }; // 60 aberturas / 10 min por IP

export default async function AvaliarPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!PUBLIC_TOKEN_RE.test(token)) notFound();

  const ip = await getClientIp();
  const rateLimit = await checkRateLimit({ key: `REVIEW_VIEW:${ip}`, ...VIEW_LIMIT });
  if (!rateLimit.success) {
    return (
      <TokenPageShell>
        <section role="status" className="flex flex-col gap-2 rounded-2xl bg-aviso-suave p-5 sm:p-6">
          <h1 className="flex items-center gap-2 text-lg font-semibold text-aviso">
            <Clock aria-hidden="true" className="size-5" />
            Muitas tentativas
          </h1>
          <p>Tente novamente daqui a alguns minutos.</p>
        </section>
      </TokenPageShell>
    );
  }

  const lead = await prisma.vendorLead.findUnique({
    where: { reviewToken: token },
    select: {
      coupleName: true,
      weddingDate: true,
      status: true,
      locked: true,
      review: { select: { rating: true } },
      vendor: { select: { companyName: true, category: true } },
    },
  });
  if (!lead || lead.locked || lead.status !== "CLOSED") notFound();

  const date = formatWeddingDate(lead.weddingDate);

  return (
    <TokenPageShell>
      <div className="flex flex-col gap-1">
        <p className={TOKEN_OVERLINE}>Avaliação verificada · {lead.vendor.category}</p>
        <h1 className="font-display text-[32px] leading-[38px] font-medium break-words sm:text-[40px] sm:leading-[46px]">
          Como foi com {lead.vendor.companyName}?
        </h1>
        <p className="text-tinta-suave">
          {lead.coupleName}
          {date ? ` · casamento em ${date}` : ""}
        </p>
      </div>

      {lead.review ? (
        <section role="status" className="flex flex-col gap-2 rounded-2xl bg-sucesso-suave p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-sucesso">
            <BadgeCheck aria-hidden="true" className="size-5" />
            Avaliação já enviada
          </h2>
          <p>Obrigado! A avaliação deste casamento já está publicada no perfil de {lead.vendor.companyName}.</p>
        </section>
      ) : (
        <ReviewForm token={token} companyName={lead.vendor.companyName} />
      )}
    </TokenPageShell>
  );
}
