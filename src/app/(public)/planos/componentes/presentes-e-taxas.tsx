import Link from "next/link";
import type { obterCatalogo } from "@/lib/catalog-server";
import { estiloDoContainerDaLanding, estiloDoSobretituloDaLanding } from "@/components/landing/styles";
import { ROTULO_DA_TAXA_DO_PRESENTE } from "@/lib/gift-fee";
import { CONDICOES_DO_PRESENTE, rotuloDoPlano } from "@/lib/plan-copy";
import { cn } from "@/lib/utils";

export const estiloDoLinkDeTexto = "font-semibold text-ameixa underline decoration-ameixa/30 underline-offset-4 transition-colors hover:decoration-ameixa";

function LinhaDeCondicao({ rotulo, children }: { rotulo: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
      <dt className="font-semibold">{rotulo}</dt>
      <dd className="text-tinta-suave">{children}</dd>
    </div>
  );
}

export function SecaoDeTaxasDosPresentes({ catalog }: { catalog: Awaited<ReturnType<typeof obterCatalogo>> }) {
  return (
    <section id="presentes" aria-labelledby="presentes-titulo" className="scroll-mt-24 border-y border-linha bg-papel">
      <div className={cn(estiloDoContainerDaLanding, "grid gap-8 py-14 lg:grid-cols-[5fr_7fr] lg:gap-16")}>
        <div className="flex flex-col gap-3">
          <p className={estiloDoSobretituloDaLanding}>Presentes em dinheiro</p>
          <h2 id="presentes-titulo" className="font-display text-[32px] font-medium leading-10 tracking-[-0.015em] sm:text-[40px] sm:leading-[46px]">
            Taxas e condições dos presentes
          </h2>
          <p className="text-base leading-6 text-tinta-suave">Os convidados presenteiam por Pix ou cartão. A forma de pagamento e o plano definem o que cada lado paga.</p>
        </div>
        <dl className="divide-y divide-linha border-y border-linha text-base leading-6">
          <LinhaDeCondicao rotulo="Plano Básico">{ROTULO_DA_TAXA_DO_PRESENTE} por presente recebido, em presentes pagos por Pix ou cartão.</LinhaDeCondicao>
          <LinhaDeCondicao rotulo={`${rotuloDoPlano(catalog.plans.classic.name)} e ${rotuloDoPlano(catalog.plans.vip.name)}`}>A taxa de {ROTULO_DA_TAXA_DO_PRESENTE} do Aceito não vale para presentes pagos por Pix.</LinhaDeCondicao>
          <LinhaDeCondicao rotulo="Pix">{CONDICOES_DO_PRESENTE.pix}</LinhaDeCondicao>
          <LinhaDeCondicao rotulo="Cartão">{CONDICOES_DO_PRESENTE.card}</LinhaDeCondicao>
          <LinhaDeCondicao rotulo="Recebimento">
            A forma e o prazo para os valores chegarem ao casal seguem as regras da carteira descritas nos{" "}
            <Link href="/termos#pagamentos" className={estiloDoLinkDeTexto}>
              termos de uso
            </Link>
            .
          </LinhaDeCondicao>
        </dl>
      </div>
    </section>
  );
}
