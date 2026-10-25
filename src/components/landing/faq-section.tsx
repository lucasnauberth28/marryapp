import type { ReactNode } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { obterCatalogo } from "@/lib/catalog-server";
import type { Catalogo } from "@/lib/catalog";
import { ROTULO_DA_TAXA_DO_PRESENTE } from "@/lib/gift-fee";
import { CONDICOES_DO_PRESENTE, rotuloDoPlano } from "@/lib/plan-copy";
import { formatarReaisEnxuto } from "@/lib/formatacao/dinheiro";
import { cn } from "@/lib/utils";
import { container, h2, lead, overline } from "./styles";

const link = "font-semibold text-ameixa underline decoration-ameixa/30 underline-offset-4 hover:decoration-ameixa";

const faqs = (catalog: Catalogo): { q: string; a: ReactNode }[] => {
  const classic = rotuloDoPlano(catalog.plans.classic.name);
  const vip = rotuloDoPlano(catalog.plans.vip.name);
  return [
    {
      q: "O que é o Aceito?",
      a: "É um serviço online para casais criarem o site do casamento, organizarem os convidados e receberem presentes em dinheiro. Os recursos disponíveis dependem do plano escolhido.",
    },
    {
      q: "Preciso pagar para começar?",
      a: `Vocês podem começar pelo plano Básico, sem mensalidade e sem cartão de crédito. Nesse plano, há uma taxa de ${ROTULO_DA_TAXA_DO_PRESENTE} por presente recebido. O ${classic} (${formatarReaisEnxuto(catalog.plans.classic.price)}) e o ${vip} (${formatarReaisEnxuto(catalog.plans.vip.price)}) têm pagamento único e outras condições.`,
    },
    {
      q: "Os convidados precisam criar conta?",
      a: "Não. Eles usam o link do convite, digitam o próprio WhatsApp para encontrar o convite e informam se vão ao casamento. Só o casal tem conta no Aceito.",
    },
    {
      q: "O Aceito envia convites pelo WhatsApp?",
      a: `Depende do plano. Em qualquer plano, vocês compartilham o link do site e do convite por onde preferirem. No ${classic} e no ${vip}, vocês também enviam convites e lembretes pelo WhatsApp, direto do painel, para os convidados que têm telefone cadastrado. No Básico, o envio pelo painel não está disponível.`,
    },
    {
      q: "Os presentes são recebidos em dinheiro?",
      a: (
        <>
          Sim. Vocês cadastram itens com um valor, como &ldquo;Jantar da lua de mel, R$ 350&rdquo;. O convidado escolhe um item e paga
          esse valor por Pix ou cartão. O item representa um valor em dinheiro para o casal, não a compra de um produto, e cada item
          pode ser presenteado uma vez. Vocês acompanham os pagamentos no painel.
          <br />
          <br />
          {CONDICOES_DO_PRESENTE.pix} {CONDICOES_DO_PRESENTE.card} {CONDICOES_DO_PRESENTE.fee}
          <br />
          <br />
          A forma e o prazo para os valores chegarem ao casal seguem as regras da carteira descritas nos{" "}
          <Link href="/termos#pagamentos" className={link}>
            termos de uso
          </Link>
          . Veja também as{" "}
          <Link href="/planos#presentes" className={link}>
            taxas e condições por plano
          </Link>
          .
        </>
      ),
    },
    {
      q: "O que a Liz faz?",
      a: "Ela sugere próximos passos com base nas informações do painel, como convidados sem resposta, convites que faltam enviar e despesas atrasadas. Ela não conversa nem age sozinha: vocês escolhem quais ações realizar.",
    },
    {
      q: "Como funciona a entrada com código QR?",
      a: `Ao confirmar presença pelo link, o convidado vê um código QR e pode salvar a imagem no celular. Na festa, ele mostra o código. Quem recebe os convidados entra no painel do casal, lê o código pela câmera do celular e registra a chegada, e o painel mostra a mesa do convidado. Também dá para buscar o convidado pelo nome. O registro de entrada faz parte do ${classic} e do ${vip}.`,
    },
    {
      q: "Posso ter um endereço próprio para o site?",
      a: `No ${vip}, sim. Registramos um endereço .com.br no nome do titular que vocês indicarem. O primeiro ano está incluído e as renovações ficam por conta do titular. Nos outros planos, o site fica em um endereço do Aceito, como meuaceito.com.br/casamento/ana-e-rafael.`,
    },
    {
      q: "Dá para deixar o site com a nossa cara?",
      a: "Dá. Vocês escolhem as fotos, a cor, a história do casal, a ordem dos blocos e o guia de trajes, sem programar nada. A prévia muda enquanto vocês editam, no celular e no computador.",
    },
    {
      q: "Como os fornecedores recebem os pedidos de orçamento?",
      a: "Os casais pedem orçamento direto na página do fornecedor. O fornecedor recebe o pedido com o nome do casal e a data do casamento e pode marcar uma reunião online ou presencial.",
    },
  ];
};

/**
 * Perguntas frequentes em acordeão nativo (<details>), sem JavaScript.
 * Só uma aberta por vez (atributo name). Onde o navegador permite, a altura anima.
 */
export async function FaqSection() {
  const FAQS = faqs(await obterCatalogo());
  return (
    <section id="duvidas" aria-labelledby="duvidas-titulo" className="py-16 sm:py-24 lg:py-28">
      <div className={cn(container, "grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-20")}>
        <Reveal className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
          <p className={cn(overline, "flex items-center gap-3")}>
            <span aria-hidden="true" className="h-px w-8 shrink-0 bg-rosa" />
            Dúvidas
          </p>
          <h2 id="duvidas-titulo" className={h2}>
            Perguntas frequentes
          </h2>
          <p className={cn(lead, "max-w-[40ch]")}>O essencial sobre planos, presentes, convidados e fornecedores.</p>
        </Reveal>

        <div className="border-t border-linha">
          {FAQS.map((faq, i) => (
            <Reveal key={faq.q} delay={i * 80}>
              <details
                name="duvidas"
                open={i === 0 || undefined}
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
                <div className="max-w-[62ch] pb-6 pr-12 text-base leading-[26px] text-tinta-suave">{faq.a}</div>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
