import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Catalog } from "@/lib/catalog";
import { GIFT_FEE_LABEL } from "@/lib/gift-fee";
import { formatReais, planLabel } from "@/lib/plan-copy";
import { Reveal } from "@/components/motion/reveal";
import { LinkButton } from "./home-ui";

/** Perguntas mais comuns, em acordeão nativo (<details>, sem JavaScript). Preços, taxa e nomes vêm do catálogo. */
export function HomeFaq({ catalog }: { catalog: Catalog }) {
  const classic = planLabel(catalog.plans.classic.name);
  const vip = planLabel(catalog.plans.vip.name);
  const faqs: { q: string; a: React.ReactNode }[] = [
    {
      q: "Preciso pagar para começar?",
      a: `Não. O Básico não tem mensalidade nem pede cartão. Há uma taxa de ${GIFT_FEE_LABEL} por presente recebido. ${classic} (${formatReais(catalog.plans.classic.price)}) e ${vip} (${formatReais(catalog.plans.vip.price)}) têm pagamento único.`,
    },
    { q: "Os convidados precisam criar conta?", a: "Não. Eles abrem o link, digitam o próprio WhatsApp e respondem." },
    {
      q: "O Aceito envia convites pelo WhatsApp?",
      a: `Em todos os planos, vocês copiam o link ou compartilham pelo WhatsApp de vocês. No ${classic} e no ${vip}, o painel também envia convites e lembretes.`,
    },
    {
      q: "Os presentes são em dinheiro?",
      a: (
        <>
          Sim. Cada item é um valor para o casal, pago por Pix ou cartão, sem entrega de produto. Prazos e forma de recebimento estão nos{" "}
          <Link href="/termos#pagamentos" className="lp-link">
            termos de uso
          </Link>
          .
        </>
      ),
    },
    { q: "O que a Liz faz?", a: "Sugere o próximo passo e responde dúvidas por assuntos prontos, com base no painel. Ela não conversa livremente nem age sozinha." },
    {
      q: "O que são as mesas em 3D?",
      a: `Um recurso do ${vip}: vocês escolhem o cenário do casamento e sentam os convidados vendo o salão. Dá para compartilhar o mapa por um link só de leitura, e só vocês alteram as mesas.`,
    },
    {
      q: "Como funciona a entrada com código QR?",
      a: `Quem confirma recebe um código QR. Na festa, a equipe lê o código pela câmera do painel. Faz parte do ${classic} e do ${vip}.`,
    },
  ];
  return (
    <>
      <section className="lp-sec lp-dentro" id="duvidas" aria-labelledby="lp-t-faq">
        <div className="lp-faq">
          <Reveal>
            <h2 className="lp-titulo lp-h2" id="lp-t-faq">
              Dúvidas?
              <br />
              <span className="lp-cor">Aqui estão as respostas.</span>
            </h2>
          </Reveal>
          <Reveal variant="right" delay={120} className="lp-faq-lista">
            {faqs.map((f) => (
              <details key={f.q} name="lp-faq">
                <summary>
                  <Plus aria-hidden="true" className="lp-ico" />
                  {f.q}
                </summary>
                <div className="lp-resp">{f.a}</div>
              </details>
            ))}
          </Reveal>
        </div>
      </section>
    </>
  );
}

/** Convite final, com a Liz em voo. */
export function Closing() {
  return (
    <section className="lp-dentro lp-fim" aria-labelledby="lp-t-final">
      <Reveal variant="scale" className="lp-final">
        <div className="lp-final-txt">
          <h2 className="lp-titulo lp-h2" id="lp-t-final">
            Vocês chegaram
            <br />
            ao fim da página.
          </h2>
          <p>Se chegaram até aqui, o próximo passo é criar a conta. Começar é grátis.</p>
          <LinkButton href="/cadastro?plano=basic" tone="claro" arrow>
            Criar conta grátis
          </LinkButton>
        </div>
        <figure className="lp-final-liz">
          <Image src="/brand/liz/voando-820.webp" alt="Liz, a fada flor do Aceito, voando com um rastro de brilho" width={820} height={542} sizes="(min-width: 900px) 460px, 300px" />
        </figure>
      </Reveal>
    </section>
  );
}
