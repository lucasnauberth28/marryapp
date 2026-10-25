import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, Clock } from "lucide-react";
import prisma from "@/lib/prisma";
import { conferirLimiteDeUso, obterIpDoCliente } from "@/lib/security/rate-limiter";
import { SOBRETITULO_DA_PAGINA_COM_TOKEN, MoldeDaPaginaComToken } from "@/components/public/token-page-shell";
import { formatarDataDoCasamento } from "@/app/(fornecedor)/_lib/datas-do-painel";
import { PADRAO_DO_TOKEN_PUBLICO } from "@/app/(fornecedor)/_lib/links-publicos";
import { FormularioDeAvaliacao } from "./review-form";

export const metadata: Metadata = {
  title: "Avaliar fornecedor",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const LIMITE_DE_VISUALIZACOES = { limit: 60, windowMs: 1000 * 60 * 10 }; // 60 aberturas / 10 min por IP

export default async function AvaliarPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!PADRAO_DO_TOKEN_PUBLICO.test(token)) notFound();

  const ip = await obterIpDoCliente();
  const rateLimit = await conferirLimiteDeUso({ key: `REVIEW_VIEW:${ip}`, ...LIMITE_DE_VISUALIZACOES });
  if (!rateLimit.success) {
    return (
      <MoldeDaPaginaComToken>
        <section role="status" className="flex flex-col gap-2 rounded-2xl bg-aviso-suave p-5 sm:p-6">
          <h1 className="flex items-center gap-2 text-lg font-semibold text-aviso">
            <Clock aria-hidden="true" className="size-5" />
            Muitas tentativas
          </h1>
          <p>Tente novamente daqui a alguns minutos.</p>
        </section>
      </MoldeDaPaginaComToken>
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

  const date = formatarDataDoCasamento(lead.weddingDate);

  return (
    <MoldeDaPaginaComToken>
      <div className="flex flex-col gap-1">
        <p className={SOBRETITULO_DA_PAGINA_COM_TOKEN}>Avaliação verificada · {lead.vendor.category}</p>
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
        <FormularioDeAvaliacao token={token} companyName={lead.vendor.companyName} />
      )}
    </MoldeDaPaginaComToken>
  );
}
