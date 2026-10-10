import { Plus } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { PLANS_CONFIG } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { container, h2, lead, overline } from "./styles";

const reais = (cents: number) => `R$ ${(cents / 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;

const FAQS = [
  {
    q: "Posso começar de graça?",
    a: `Podem. O plano Básico é gratuito para sempre e já traz o site, a lista de presentes com Pix e cartão e as confirmações de presença. Se quiserem mais, o Classic (${reais(PLANS_CONFIG.classic.price)}) e o VIP (${reais(PLANS_CONFIG.vip.price)}) são pagos uma vez só, sem mensalidade.`,
  },
  {
    q: "Como funciona a taxa zero no Pix?",
    a: "Nos planos Classic e VIP, todo presente pago em Pix cai inteiro na conta de vocês, sem comissão. No plano Básico há uma taxa de 2,99% por presente recebido.",
  },
  {
    q: "Os convidados precisam criar conta para confirmar presença?",
    a: "Não. O convidado abre o link do convite, digita o próprio WhatsApp, vê só o convite dele e responde em dois toques. Para lembrar quem ainda não respondeu, vocês mandam o lembrete pelo WhatsApp direto do painel, nos planos Classic e VIP.",
  },
  {
    q: "Dá para deixar o site com a nossa cara?",
    a: "Dá. Vocês escolhem as fotos, a cor, a história do casal, a ordem dos blocos e o guia de trajes, sem programar nada. A prévia muda enquanto vocês editam, no celular e no computador.",
  },
  {
    q: "Como os fornecedores recebem os pedidos de orçamento?",
    a: "Os casais pedem orçamento direto na vitrine de fornecedores. O fornecedor recebe o pedido com o nome do casal e a data do casamento e pode marcar uma reunião online ou presencial.",
  },
];

/**
 * Perguntas frequentes em acordeão nativo (<details>), sem JavaScript.
 * Só uma aberta por vez (atributo name). Onde o navegador permite, a altura anima.
 */
export function FaqSection() {
  return (
    <section id="duvidas" aria-labelledby="duvidas-titulo" className="py-16 sm:py-24 lg:py-28">
      <div className={cn(container, "grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-20")}>
        <Reveal className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
          <p className={cn(overline, "flex items-center gap-3")}>
            <span aria-hidden="true" className="h-px w-8 shrink-0 bg-champanhe" />
            Dúvidas frequentes
          </p>
          <h2 id="duvidas-titulo" className={h2}>
            O que todo casal pergunta.
          </h2>
          <p className={cn(lead, "max-w-[40ch]")}>O essencial sobre presentes, convidados e fornecedores, sem letra miúda.</p>
        </Reveal>

        <div className="border-t border-linha">
          {FAQS.map((faq, i) => (
            <Reveal key={faq.q} delay={i * 80}>
              <details
                name="duvidas"
                className={cn(
                  "group border-b border-linha [interpolate-size:allow-keywords]",
                  "[&::details-content]:h-0 [&::details-content]:overflow-clip [&::details-content]:transition-[height,content-visibility] [&::details-content]:duration-500 [&::details-content]:ease-[var(--ease-aceito)] [&::details-content]:[transition-behavior:allow-discrete]",
                  "open:[&::details-content]:h-auto",
                )}
              >
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 text-[17px] font-semibold leading-6 text-tinta transition-colors duration-200 hover:text-ameixa sm:text-lg [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-full border border-linha text-tinta-suave transition-[transform,background-color,border-color,color] duration-500 ease-[var(--ease-aceito)] group-open:rotate-45 group-open:border-ameixa group-open:bg-ameixa group-open:text-on-ameixa"
                  >
                    <Plus className="size-4" strokeWidth={2} />
                  </span>
                </summary>
                <p className="max-w-[62ch] pb-6 pr-12 text-base leading-[26px] text-tinta-suave">{faq.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
