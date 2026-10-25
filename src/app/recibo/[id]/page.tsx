import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { obterSessao, redirecionarParaOLogin } from "@/lib/security/auth-guard";
import { cn } from "@/lib/utils";
import { BotaoDeImprimir } from "./print-button";
import { buscarPagamentoDoRecibo, ehPagamentoAprovado, linhasDoCliente, linhasDoPagamento, quemPodeVer } from "./_recibo/dados";
import { CabecalhoDoRecibo, RodapeDoRecibo, SecaoDeLinhas, SecaoDeValores } from "./_recibo/secoes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recibo",
  robots: { index: false, follow: false },
};

const PADRAO_DE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Recibo de uma assinatura paga. Só o dono vê (a conta que pagou; nos planos de casal, as duas
 * contas do casamento) e quem tem acesso a /assinaturas. Para os outros, a página não existe.
 */
export default async function ReciboPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await obterSessao();
  if (!session) return redirecionarParaOLogin();

  const { id } = await params;
  if (!PADRAO_DE_UUID.test(id)) notFound();

  const sub = await buscarPagamentoDoRecibo(id);
  if (!ehPagamentoAprovado(sub)) notFound();
  const { isOwner, isAdmin } = await quemPodeVer(sub, session);
  if (!isOwner && !isAdmin) notFound();

  const isVendor = sub.planType === "VENDOR";
  const backHref = isOwner ? (isVendor ? "/fornecedor/plano" : "/plano") : `/admin/planos/assinaturas?id=${sub.id}`;
  const pagador = (isVendor && sub.user?.partnerVendor?.companyName) || sub.user?.name || "cliente";

  return (
    <div className="min-h-dvh bg-linho px-4 py-6 text-tinta sm:px-6 sm:py-10 print:bg-white print:p-0">
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link href={backHref} className={cn(estiloDoBotao.quiet, "min-h-11 -ml-3")}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            Voltar
          </Link>
          <BotaoDeImprimir />
        </div>

        <article aria-labelledby="recibo-titulo" className="flex flex-col gap-7 rounded-2xl border border-linha bg-papel p-6 shadow-[var(--shadow-aceito-1)] sm:p-10 print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none">
          <CabecalhoDoRecibo id={sub.id} />
          <p className="text-[15px] leading-6">
            Recebemos de <strong className="font-semibold">{pagador}</strong> o valor de <strong className="font-semibold">{formatarReais(sub.amount)}</strong> pelo plano {sub.planName} no Aceito.
          </p>
          <SecaoDeLinhas id="cliente" titulo="Cliente" linhas={linhasDoCliente(sub)} />
          <SecaoDeLinhas id="pagamento" titulo="Pagamento" linhas={linhasDoPagamento(sub)} />
          <SecaoDeValores sub={sub} />
          <RodapeDoRecibo />
        </article>
      </div>
    </div>
  );
}
