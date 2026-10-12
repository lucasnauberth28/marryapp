import type { Metadata } from "next";
import Image from "@/components/landing/photo";
import Link from "next/link";
import { ArrowRight, Check, Copy, Flower2, Gift, Globe, Heart, LayoutGrid, MapPin, MessageCircle, NotebookPen, QrCode, Store, Users } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Parallax } from "@/components/motion/parallax";
import { ScrollProgress } from "@/components/motion/scroll-progress";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { AnchorLink } from "@/components/landing/anchor-link";
import { CouplePlanCard } from "@/components/landing/couple-plan-card";
import { FaqSection } from "@/components/landing/faq-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { Seal } from "@/components/landing/seal";
import { SplitWords } from "@/components/landing/split-heading";
import { btn, btnArrow, container, h2, lead, overline } from "@/components/landing/styles";
import type { Catalog } from "@/lib/catalog";
import { getCatalog } from "@/lib/catalog-server";
import { GIFT_FEE_LABEL } from "@/lib/gift-fee";
import { cn } from "@/lib/utils";
import { CountUp, RsvpDemo, VendorStrip } from "./home-landing-client";

// Os preços vêm do catálogo da administração: a página se refaz sozinha a cada 5 minutos e na hora que um preço muda.
export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: "Aceito | Site de casamento, convidados e presentes em dinheiro" },
  description:
    "Criem o site do casamento, acompanhem confirmações de presença e recebam presentes em dinheiro com o Aceito. Conheçam os planos e as taxas.",
};

const IMG = "/images/aceito";

/* Fio fino que acompanha os sobretítulos. */
function Overline({ children, className, tone = "champanhe" }: { children: React.ReactNode; className?: string; tone?: "champanhe" | "on-ameixa" }) {
  return (
    <p className={cn(overline, "flex items-center gap-3", className)}>
      <span aria-hidden="true" className={cn("h-px w-8 shrink-0", tone === "champanhe" ? "bg-champanhe" : "bg-on-ameixa/50")} />
      {children}
    </p>
  );
}

/* Pequeno arco usado como separador decorativo. */
function ArchGlyph({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 16" className={cn("h-4 w-3 shrink-0", className)} fill="none">
      <path d="M1 15.5V6a5 5 0 0 1 10 0v9.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

/* ============================================================================================ */
/* 1. Primeira tela: o que é o Aceito e qual é a primeira ação                                   */
/* ============================================================================================ */

function Hero() {
  return (
    <section aria-labelledby="hero-titulo" className="relative">
      <div className={cn(container, "grid items-center gap-14 pb-16 pt-8 sm:pt-14 lg:grid-cols-12 lg:gap-8 lg:pb-28 lg:pt-16")}>
        <div className="flex flex-col gap-6 lg:col-span-7 lg:pr-6">
          <Reveal variant="fade">
            <Overline>Site e organização do casamento</Overline>
          </Reveal>
          <h1
            id="hero-titulo"
            className="font-display text-[40px] font-normal leading-[46px] tracking-[-0.02em] text-tinta sm:text-[56px] sm:leading-[62px] lg:text-[clamp(56px,5.2vw,76px)] lg:leading-[1.05]"
          >
            <SplitWords parts={["Criem o site do casamento e acompanhem quem vai à ", { em: "festa" }, "."]} baseDelay={120} step={60} />
          </h1>
          <Reveal delay={650}>
            <p className={cn(lead, "max-w-[54ch] lg:text-xl lg:leading-[30px]")}>
              Com o Aceito, vocês reúnem as informações do casamento, compartilham o convite e acompanham as confirmações de
              presença em um painel. Também podem receber presentes em dinheiro por Pix ou cartão.
            </p>
          </Reveal>
          <Reveal delay={780} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
            <Link href="/cadastro?plano=basic" className={btn.primary}>
              Criar conta grátis
              <ArrowRight aria-hidden="true" className={btnArrow} />
            </Link>
            <AnchorLink href="/#como" className={btn.secondary}>
              Ver como funciona
            </AnchorLink>
          </Reveal>
          <Reveal delay={880} variant="fade">
            <p className="max-w-[54ch] text-sm leading-5 text-tinta-suave">
              Comecem pelo plano Básico, sem cartão de crédito e sem mensalidade. Nesse plano, há uma taxa de {GIFT_FEE_LABEL} por presente
              recebido.{" "}
              <Link href="/planos#presentes" className="font-semibold text-ameixa underline decoration-ameixa/30 underline-offset-4 hover:decoration-ameixa">
                Ver taxas e condições
              </Link>
            </p>
          </Reveal>
        </div>

        <div className="relative mx-auto w-full max-w-[290px] pb-12 sm:max-w-[360px] lg:col-span-5 lg:mr-0 lg:max-w-[400px] lg:pb-16">
          <div className="relative">
            {/* Moldura champanhe deslocada, que se move num ritmo diferente da foto. */}
            <Parallax strength={26} className="pointer-events-none absolute inset-0">
              <Reveal variant="fade" delay={1100} className="arch absolute -inset-2 border border-champanhe sm:-inset-2.5">
                <span aria-hidden="true" />
              </Reveal>
            </Parallax>
            <Parallax strength={40}>
              <Reveal variant="arch" delay={150} className="arch relative aspect-[3/4] overflow-hidden bg-areia">
                <Image
                  src={`${IMG}/img-01-casal-capa.webp`}
                  alt="Noivos abraçados num campo ao pôr do sol"
                  fill
                  preload
                  sizes="(min-width: 1024px) 400px, (min-width: 640px) 360px, 290px"
                  className="object-cover object-[50%_30%] transition-transform duration-[2400ms] ease-[var(--ease-aceito)] [.js_&]:scale-[1.08] [.js_[data-revealed]_&]:scale-100"
                />
              </Reveal>
            </Parallax>
          </div>

          <div className="absolute -left-3 bottom-0 z-10 sm:-left-12 lg:-left-20">
            <Parallax strength={60}>
              <Reveal
                delay={1000}
                className="w-[264px] rounded-[16px] border border-linha bg-papel p-4 shadow-[var(--shadow-aceito-2)] sm:w-[300px] sm:p-5"
              >
                <p className="mb-3 text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave">Exemplo do painel</p>
                <p className="flex items-center gap-3 whitespace-nowrap text-[15px] font-semibold leading-5 text-tinta">
                  <Seal />
                  Mariana confirmou presença
                </p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-areia">
                  <div className="h-full w-[61%] origin-left rounded-full bg-sucesso transition-transform delay-[1300ms] duration-[1600ms] ease-[var(--ease-aceito)] [.js_&]:scale-x-0 [.js_[data-revealed]_&]:scale-x-100" />
                </div>
                <p className="mt-2 text-sm text-tinta-suave">
                  <CountUp to={86} delay={1300} /> de 140 convidados confirmaram
                </p>
              </Reveal>
            </Parallax>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================================ */
/* 2. As três funções principais                                                                */
/* ============================================================================================ */

const FUNCTIONS = [
  {
    icon: Globe,
    title: "Site do casamento",
    text: "Reúnam fotos, local, data, horário e orientações para os convidados em um endereço para compartilhar.",
  },
  {
    icon: Users,
    title: "Confirmações de presença",
    text: "Acompanhem quem vai ao casamento e quem ainda não respondeu. Os convidados confirmam pelo link, sem criar conta.",
  },
  {
    icon: Gift,
    title: "Presentes em dinheiro",
    text: "Recebam presentes por Pix ou cartão e acompanhem os valores recebidos. As taxas dependem do plano e da forma de pagamento.",
    link: { href: "/planos#presentes", label: "Ver taxas e condições" },
  },
];

function Functions() {
  return (
    <section id="funcoes" aria-labelledby="funcoes-titulo" className="border-y border-linha bg-papel py-16 sm:py-20 lg:py-24">
      <div className={container}>
        <Reveal className="max-w-[640px]">
          <h2 id="funcoes-titulo" className={h2}>
            O que vocês podem fazer com o Aceito
          </h2>
        </Reveal>
        <ul className="mt-10 grid gap-6 md:grid-cols-3 lg:mt-14 lg:gap-8">
          {FUNCTIONS.map(({ icon: Icon, title, text, link }, i) => (
            <Reveal as="li" key={title} delay={i * 100} className="flex flex-col gap-3 border-t border-linha-forte pt-6">
              <span className="grid size-12 place-items-center rounded-full bg-ameixa-suave text-ameixa">
                <Icon aria-hidden="true" className="size-6" strokeWidth={1.75} />
              </span>
              <h3 className="mt-2 text-xl font-semibold leading-7 text-tinta">{title}</h3>
              <p className="text-base leading-[26px] text-tinta-suave">{text}</p>
              {link ? (
                <Link
                  href={link.href}
                  className="mt-1 w-fit font-semibold text-ameixa underline decoration-ameixa/30 underline-offset-4 transition-colors hover:decoration-ameixa"
                >
                  {link.label}
                </Link>
              ) : null}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ============================================================================================ */
/* 3. Como começar                                                                              */
/* ============================================================================================ */

const STEPS = [
  {
    title: "Criem a conta e preparem o site",
    text: "Adicionem as informações do casamento e confiram como os convidados vão vê-las.",
    img: "img-04-cerimonia.webp",
    alt: "Corredor de cerimônia ao ar livre com pétalas e cadeiras de madeira",
    chip: (
      <>
        <Globe aria-hidden="true" className="size-4 shrink-0 text-ameixa" strokeWidth={2} />
        <span className="min-w-0 truncate">Exemplo: /casamento/ana-e-rafael</span>
      </>
    ),
  },
  {
    title: "Compartilhem o convite",
    text: "Enviem o link para os convidados. Eles respondem sem precisar criar uma conta no Aceito.",
    img: "img-14-fotografia-detalhes.webp",
    alt: "Convite em papel, alianças e sapatos da noiva sobre linho",
    chip: (
      <>
        <Copy aria-hidden="true" className="size-4 shrink-0 text-ameixa" strokeWidth={2} />
        <span className="min-w-0 truncate">Exemplo: link do convite copiado</span>
      </>
    ),
  },
  {
    title: "Acompanhem as respostas",
    text: "Confiram quem confirmou presença, quem não poderá ir e quem ainda não respondeu.",
    img: "img-05-recepcao.webp",
    alt: "Salão de recepção com mesas postas e luzes suspensas",
    chip: (
      <>
        <Users aria-hidden="true" className="size-4 shrink-0 text-ameixa" strokeWidth={2} />
        <span className="min-w-0 truncate">Exemplo: 86 confirmaram, 32 sem resposta</span>
      </>
    ),
  },
];

function HowItWorks() {
  return (
    <section id="como" aria-labelledby="como-titulo" className="scroll-mt-16 border-b border-linha py-16 sm:py-24 lg:py-28">
      <div className={container}>
        <Reveal className="flex max-w-[640px] flex-col gap-4">
          <Overline>Como funciona</Overline>
          <h2 id="como-titulo" className={h2}>
            Como começar a usar o Aceito
          </h2>
        </Reveal>

        <ol className="mt-10 grid gap-12 md:mt-16 md:grid-cols-3 md:gap-6 lg:gap-8">
          {STEPS.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 120} className="group flex flex-col">
              <div className="zoom-media relative aspect-[4/3] overflow-hidden rounded-[16px] bg-areia">
                <Image src={`${IMG}/${step.img}`} alt={step.alt} fill sizes="(min-width: 1200px) 380px, (min-width: 768px) 33vw, 100vw" className="object-cover" />
                <p className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-[12px] border border-linha/70 bg-papel/95 px-3 py-2.5 text-sm font-semibold leading-5 text-tinta shadow-[var(--shadow-aceito-2)] backdrop-blur-sm transition-transform duration-500 ease-[var(--ease-aceito)] group-hover:-translate-y-1">
                  {step.chip}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <span aria-hidden="true" className="font-display text-[34px] leading-10 text-ameixa">
                  {i + 1}
                </span>
                <span
                  aria-hidden="true"
                  className="h-px flex-1 origin-left bg-linha transition-colors duration-500 group-hover:bg-champanhe"
                />
              </div>
              <h3 className="mt-3 text-xl font-semibold leading-7 text-tinta">{step.title}</h3>
              <p className="mt-2 text-base leading-[26px] text-tinta-suave">{step.text}</p>
            </Reveal>
          ))}
        </ol>

        <Reveal delay={150} className="mt-10 max-w-[70ch] border-l-2 border-champanhe pl-4 text-[15px] leading-6 text-tinta-suave">
          <p>
            <strong className="font-semibold text-tinta">Como o convite chega.</strong> No Básico, vocês compartilham o link por onde
            preferirem. No Classic e no VIP, também podem enviar convites e lembretes pelo WhatsApp, direto do painel.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================================================ */
/* 4. Demonstração de convite e confirmação                                                     */
/* ============================================================================================ */

const GUEST_POINTS = [
  "O convidado digita o próprio WhatsApp e vê só o convite dele.",
  "Os lugares reservados contam com o próprio convidado: 2 lugares são ele e mais 1 acompanhante.",
  "Restrição alimentar e acompanhantes são informadas na mesma resposta.",
];

function Guests() {
  return (
    <section id="convidados" aria-labelledby="convidados-titulo" className="scroll-mt-16 bg-areia/45 py-16 sm:py-24 lg:py-28">
      <div className={cn(container, "grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-10")}>
        <div className="flex flex-col gap-5 lg:order-2 lg:col-span-6 lg:pl-10">
          <Reveal className="flex flex-col gap-4">
            <Overline>Para os convidados</Overline>
            <h2 id="convidados-titulo" className={h2}>
              Seus convidados confirmam presença pelo link
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className={lead}>
              O convidado abre o convite e informa se vai ao casamento. A resposta aparece na lista de vocês, sem que ele precise criar
              uma conta.
            </p>
          </Reveal>
          <ul className="mt-1 flex flex-col gap-3">
            {GUEST_POINTS.map((point, i) => (
              <Reveal as="li" key={point} delay={200 + i * 80} className="flex items-start gap-3 text-base leading-6 text-tinta">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-sucesso-suave text-sucesso">
                  <Check aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
                </span>
                {point}
              </Reveal>
            ))}
          </ul>
          <Reveal delay={480} className="flex gap-4 rounded-[16px] border border-linha bg-papel p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ameixa-suave text-ameixa">
              <QrCode aria-hidden="true" className="size-5" strokeWidth={1.75} />
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold leading-6 text-tinta">Entrada na festa com código QR</h3>
              <p className="text-[15px] leading-6 text-tinta-suave">
                Depois de confirmar, o convidado recebe um código QR. Na festa, quem recebe os convidados lê o código pela câmera do painel
                e registra a chegada. O registro de entrada faz parte do Classic e do VIP.
              </p>
            </div>
          </Reveal>
        </div>

        <div className="relative lg:order-1 lg:col-span-6 lg:min-h-[640px]">
          <div className="w-[70%] max-w-[340px] lg:absolute lg:left-0 lg:top-0 lg:w-[56%]">
            <Parallax strength={40}>
              <Reveal variant="arch" className="arch relative aspect-[3/4] overflow-hidden bg-areia">
                <Image
                  src={`${IMG}/img-22-album-brinde.webp`}
                  alt="Convidados brindando com taças de espumante na festa"
                  fill
                  sizes="(min-width: 1024px) 330px, 70vw"
                  className="object-cover"
                />
              </Reveal>
            </Parallax>
          </div>
          <div className="relative -mt-32 flex justify-end sm:-mt-48 lg:absolute lg:bottom-0 lg:right-0 lg:mt-0">
            <Reveal delay={200} className="w-full max-w-[380px]">
              <RsvpDemo />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================================ */
/* 5a. Detalhes do site                                                                         */
/* ============================================================================================ */

const SITE_POINTS = [
  { icon: Heart, text: "Fotos e história do casal" },
  { icon: MapPin, text: "Local, data e horário" },
  { icon: NotebookPen, text: "Orientações sobre o traje" },
  { icon: Gift, text: "Confirmação de presença e presentes em dinheiro, no mesmo endereço" },
];

function CoupleSite() {
  return (
    <section aria-labelledby="site-titulo" className="py-16 sm:py-24 lg:py-32">
      <div className={cn(container, "grid gap-14 lg:grid-cols-12 lg:items-center lg:gap-10")}>
        <div className="flex flex-col gap-5 lg:col-span-5 lg:pr-8">
          <Reveal variant="fade">
            <Overline>O site do casamento</Overline>
          </Reveal>
          <h2 id="site-titulo" className={h2}>
            As informações do casamento em um site para compartilhar
          </h2>
          <Reveal delay={200}>
            <p className={lead}>
              Adicionem fotos, a história de vocês, local, horário e orientações sobre o traje. Os convidados encontram essas informações
              pelo endereço do site.
            </p>
          </Reveal>
          <ul className="mt-2 flex flex-col border-t border-linha">
            {SITE_POINTS.map(({ icon: Icon, text }, i) => (
              <Reveal as="li" key={text} delay={280 + i * 80} className="flex items-center gap-4 border-b border-linha py-4 text-base text-tinta">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ameixa-suave text-ameixa">
                  <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />
                </span>
                {text}
              </Reveal>
            ))}
          </ul>
          <Reveal delay={600}>
            <p className="rounded-[12px] border border-linha bg-papel px-4 py-3 text-[15px] leading-6 text-tinta-suave">
              <span className="block text-xs font-semibold uppercase leading-4 tracking-[0.08em]">Exemplo de endereço no Aceito</span>
              <span className="break-all font-semibold text-tinta">meuaceito.com.br/casamento/ana-e-rafael</span>
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-12 gap-3 sm:gap-6 lg:col-span-7">
          <div className="col-span-7">
            <Parallax strength={30}>
              <Reveal variant="arch" className="arch zoom-media relative aspect-[3/4] overflow-hidden bg-areia">
                <Image
                  src={`${IMG}/img-02-historia-1.webp`}
                  alt="Casal sorrindo à mesa de um café ao ar livre"
                  fill
                  sizes="(min-width: 1200px) 400px, (min-width: 1024px) 34vw, 58vw"
                  className="object-cover"
                />
              </Reveal>
            </Parallax>
          </div>
          <div className="col-span-5 flex flex-col gap-3 pt-14 sm:gap-6 sm:pt-24">
            <Parallax strength={60}>
              <Reveal variant="up" delay={150} className="zoom-media relative aspect-[4/5] overflow-hidden rounded-[16px] bg-areia">
                <Image
                  src={`${IMG}/img-21-papelaria.webp`}
                  alt="Convite em papel algodão com envelope ameixa e selo de cera"
                  fill
                  sizes="(min-width: 1200px) 290px, (min-width: 1024px) 24vw, 40vw"
                  className="object-cover"
                />
              </Reveal>
            </Parallax>
            <Parallax strength={45}>
              <Reveal variant="up" delay={260} className="zoom-media relative aspect-square overflow-hidden rounded-[16px] bg-areia">
                <Image
                  src={`${IMG}/img-03-historia-2.webp`}
                  alt="Mãos do casal entrelaçadas, com a aliança em destaque"
                  fill
                  sizes="(min-width: 1200px) 290px, (min-width: 1024px) 24vw, 40vw"
                  className="object-cover object-[50%_40%]"
                />
              </Reveal>
            </Parallax>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================================ */
/* 5b. Detalhes dos presentes                                                                   */
/* ============================================================================================ */

const GIFT_EXAMPLES = [
  { title: "Jantar da lua de mel", value: "R$ 350" },
  { title: "Entrada da geladeira", value: "R$ 500" },
  { title: "Passeio de barco", value: "R$ 220" },
];

function Gifts() {
  return (
    <section id="presentes" aria-labelledby="presentes-titulo" className="scroll-mt-16 border-t border-linha bg-papel py-16 sm:py-24 lg:py-28">
      <div className={cn(container, "grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-10")}>
        <div className="flex flex-col gap-5 lg:col-span-6 lg:pr-8">
          <Reveal variant="fade">
            <Overline>Presentes</Overline>
          </Reveal>
          <h2 id="presentes-titulo" className={h2}>
            Recebam presentes em dinheiro
          </h2>
          <Reveal delay={150}>
            <p className={lead}>
              Os convidados podem presentear vocês por Pix ou cartão. Vocês acompanham os valores pelo Aceito e consultam as condições do
              plano.
            </p>
          </Reveal>
          <ul className="mt-1 flex flex-col border-t border-linha text-base leading-6">
            <li className="border-b border-linha py-3.5">
              <strong className="font-semibold text-tinta">Pix:</strong>{" "}
              <span className="text-tinta-suave">quem presenteia paga o valor do item, sem acréscimo.</span>
            </li>
            <li className="border-b border-linha py-3.5">
              <strong className="font-semibold text-tinta">Cartão:</strong>{" "}
              <span className="text-tinta-suave">a tarifa do cartão entra no total que o convidado vê antes de pagar, com parcelamento em até 12 vezes.</span>
            </li>
            <li className="border-b border-linha py-3.5">
              <strong className="font-semibold text-tinta">Taxa do Aceito:</strong>{" "}
              <span className="text-tinta-suave">
                {GIFT_FEE_LABEL} por presente recebido no Básico. No Classic e no VIP, essa taxa não vale para presentes pagos por Pix.
              </span>
            </li>
          </ul>
          <Reveal delay={250}>
            <Link
              href="/planos#presentes"
              className="inline-flex min-h-11 items-center gap-2 font-semibold text-ameixa underline decoration-ameixa/30 underline-offset-4 transition-colors hover:decoration-ameixa"
            >
              Ver taxas e condições
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Reveal>
        </div>

        <Reveal delay={200} className="lg:col-span-6">
          <div className="rounded-[16px] border border-linha bg-linho p-5 shadow-[var(--shadow-aceito-1)] sm:p-7">
            <p className="text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave">Exemplo de lista de presentes</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {GIFT_EXAMPLES.map((gift) => (
                <li key={gift.title} className="flex flex-col gap-2 rounded-[12px] border border-linha bg-papel p-4">
                  <span className="grid size-10 place-items-center rounded-full bg-ameixa-suave text-ameixa">
                    <Gift aria-hidden="true" className="size-5" strokeWidth={1.75} />
                  </span>
                  <span className="text-[15px] font-semibold leading-5 text-tinta">{gift.title}</span>
                  <span className="font-display text-2xl leading-8 tabular-nums">{gift.value}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-linha pt-4 text-[15px] leading-6 text-tinta-suave">
              Cada item tem um valor definido por vocês. Para quem presenteia, o item representa um valor em dinheiro para o casal, sem
              entrega de produto.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================================================ */
/* 6. Sugestões da Liz e recursos complementares                                                */
/* ============================================================================================ */

const MADRINHA_POINTS = ["Convidados que ainda não responderam", "Convites que ainda faltam enviar", "Despesas com vencimento atrasado"];

function Liz() {
  return (
    <section aria-labelledby="madrinha-titulo" className="relative overflow-hidden bg-ameixa text-on-ameixa">
      {/* Arco ornamental em fio champanhe. */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-16 hidden w-[520px] lg:block">
        <Parallax strength={50}>
          <div className="arch aspect-[3/4] border border-champanhe/45" />
        </Parallax>
      </div>

      <div className={cn(container, "relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2 lg:gap-16 lg:py-32")}>
        <div className="flex flex-col gap-5">
          <Reveal variant="fade">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-on-ameixa/85">
              <Flower2 aria-hidden="true" className="size-4" strokeWidth={1.75} />
              Conheça a Liz
            </p>
          </Reveal>
          <h2 id="madrinha-titulo" className={cn(h2, "text-on-ameixa")}>
            <SplitWords parts={["A Liz ajuda vocês a escolher o próximo passo"]} step={55} />
          </h2>
          <Reveal delay={200}>
            <p className="max-w-[48ch] text-[17px] leading-[26px] text-on-ameixa/90 sm:text-lg sm:leading-7">
              A Liz usa as informações do painel para sugerir o que merece atenção, como convidados sem resposta e convites que faltam
              enviar. Vocês escolhem o que fazer.
            </p>
          </Reveal>
          <ul className="flex flex-col border-t border-on-ameixa/20">
            {MADRINHA_POINTS.map((p, i) => (
              <Reveal as="li" key={p} delay={260 + i * 80} className="flex items-center gap-3 border-b border-on-ameixa/20 py-3.5 text-base">
                <ArchGlyph className="text-champanhe" />
                {p}
              </Reveal>
            ))}
          </ul>
          <Reveal delay={480} className="pt-2">
            <Link href="/cadastro?plano=basic" className={cn(btn.onAmeixa, "max-sm:w-full")}>
              Criar conta grátis
              <ArrowRight aria-hidden="true" className={btnArrow} />
            </Link>
          </Reveal>
        </div>

        <div className="relative flex flex-col gap-4 text-tinta sm:pl-10 lg:pl-6">
          {/* Cartão principal: exemplo de sugestão da Liz */}
          <div className="relative w-full max-w-[480px]">
            <Parallax strength={60}>
              <Reveal variant="up" delay={300}>
                <aside
                  aria-label="Exemplo de sugestão da Liz"
                  className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 rounded-[16px] border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-2)] sm:p-6"
                >
                  <span className="grid h-[52px] w-10 place-items-center rounded-[999px_999px_6px_6px] bg-salvia-suave text-salvia">
                    <Flower2 aria-hidden="true" className="size-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold leading-5">
                      Liz <span className="font-normal text-tinta-suave">· sugestão do painel</span>
                    </p>
                    <p className="mt-1 text-base leading-6">
                      32 convidados ainda não responderam. O prazo de confirmação termina em nove dias. Vocês podem revisar a lista e
                      preparar um lembrete.
                    </p>
                  </div>
                  <p className="col-start-2 text-sm leading-5 text-tinta-suave">Exemplo com dados fictícios. A decisão é de vocês.</p>
                </aside>
              </Reveal>
            </Parallax>
          </div>
        </div>
      </div>
    </section>
  );
}

const MORE_FEATURES = [
  { icon: MessageCircle, title: "Convites e lembretes pelo WhatsApp", text: "Enviados pelo painel, no Classic e no VIP." },
  { icon: QrCode, title: "Registro de entrada com código QR", text: "Lido pela câmera do painel na festa, no Classic e no VIP." },
  { icon: NotebookPen, title: "Mural de recados", text: "Os convidados deixam mensagens no site do casamento." },
  { icon: LayoutGrid, title: "Mesas e restrições alimentares", text: "Organizem os lugares e consultem o que cada convidado informou." },
];

function MoreFeatures() {
  return (
    <section aria-labelledby="mais-titulo" className="border-b border-linha py-14 sm:py-20">
      <div className={container}>
        <Reveal className="max-w-[640px]">
          <h2 id="mais-titulo" className="font-display text-[28px] font-normal leading-9 tracking-[-0.01em] text-tinta sm:text-[34px] sm:leading-10">
            Recursos complementares
          </h2>
        </Reveal>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MORE_FEATURES.map(({ icon: Icon, title, text }, i) => (
            <Reveal as="li" key={title} delay={i * 80} className="flex flex-col gap-2 rounded-[16px] border border-linha bg-papel p-5">
              <Icon aria-hidden="true" className="size-5 text-ameixa" strokeWidth={1.75} />
              <h3 className="text-base font-semibold leading-6 text-tinta">{title}</h3>
              <p className="text-[15px] leading-[22px] text-tinta-suave">{text}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ============================================================================================ */
/* 7. Fornecedores para o casal                                                                 */
/* ============================================================================================ */

const VENDORS = [
  { img: "img-12-fotografia-golden-hour.webp", alt: "Casal caminhando num campo ao entardecer", cat: "Fotografia", caption: "Ensaio ao pôr do sol" },
  { img: "img-16-buffet-doces.webp", alt: "Mesa de doces com bolo branco e flores", cat: "Buffet e doces", caption: "Mesa de doces" },
  { img: "img-17-espaco.webp", alt: "Casarão de fazenda com gramado ao entardecer", cat: "Espaço", caption: "Casarão no campo" },
  { img: "img-18-decoracao.webp", alt: "Arranjo de rosas e velas sobre a mesa dos noivos", cat: "Decoração", caption: "Flores e velas" },
  { img: "img-15-fotografia-festa.webp", alt: "Noivos dançando com os convidados na festa", cat: "Fotografia", caption: "Pista de dança" },
];

function Vendors() {
  return (
    <section aria-labelledby="fornecedores-titulo" className="overflow-hidden bg-salvia-suave py-16 sm:py-24 lg:py-28">
      <div className={cn(container, "flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-16")}>
        <Reveal className="flex max-w-[660px] flex-col gap-4">
          <p className={cn(overline, "flex items-center gap-3 text-salvia")}>
            <Store aria-hidden="true" className="size-4" strokeWidth={1.75} />
            Fornecedores para o casamento
          </p>
          <h2 id="fornecedores-titulo" className={h2}>
            Encontrem fornecedores para o casamento
          </h2>
          <p className={lead}>
            Procurem fotógrafos, espaços, buffets e outros profissionais na região do casamento. Conheçam o trabalho de cada fornecedor e
            peçam orçamento.
          </p>
          <p className="text-[15px] leading-6 text-tinta-suave">
            O rótulo &ldquo;Com curadoria&rdquo; indica que o Aceito analisou o cadastro do fornecedor. Ele não garante qualidade nem preço.
          </p>
        </Reveal>
        <Reveal delay={150} className="flex shrink-0 flex-col gap-2 sm:flex-row sm:gap-3">
          <Link href="/fornecedores" className={btn.primary}>
            Encontrar fornecedores
            <ArrowRight aria-hidden="true" className={btnArrow} />
          </Link>
        </Reveal>
      </div>

      <Reveal variant="fade" delay={200}>
        <VendorStrip className="mt-10 scroll-pl-4 sm:scroll-pl-6 lg:mt-16" trackClassName="gap-4 px-4 sm:gap-6 sm:px-6 xl:pl-[calc((100%-1200px)/2+24px)]">
          {VENDORS.map((v) => (
            <figure key={v.img} className="group w-[78vw] max-w-[460px] shrink-0 snap-start sm:w-[52vw] lg:w-[34vw]">
              <div className="zoom-media relative aspect-[4/3] overflow-hidden rounded-[16px] bg-areia">
                <Image src={`${IMG}/${v.img}`} alt={v.alt} fill sizes="(min-width: 1024px) 460px, (min-width: 640px) 52vw, 78vw" className="object-cover" />
              </div>
              <figcaption className="mt-4 flex items-center justify-between gap-3">
                <span className="inline-flex min-h-7 items-center rounded-[6px] border border-salvia/25 bg-papel px-2.5 text-sm font-semibold text-salvia">
                  {v.cat}
                </span>
                <span className="truncate text-sm text-tinta-suave">{v.caption}</span>
              </figcaption>
            </figure>
          ))}
        </VendorStrip>
      </Reveal>
    </section>
  );
}

/* ============================================================================================ */
/* 8. Planos e condições (só casais; os planos de fornecedor ficam em /planos#fornecedores)      */
/* ============================================================================================ */

const COUPLE_PLAN_KEYS = ["basic", "classic", "vip"] as const;

function Plans({ catalog }: { catalog: Catalog }) {
  return (
    <section id="planos" aria-labelledby="planos-titulo" className="scroll-mt-16 py-16 sm:py-24 lg:py-28">
      <div className={container}>
        <Reveal className="flex max-w-[720px] flex-col gap-4">
          <Overline>Planos para casais</Overline>
          <h2 id="planos-titulo" className={h2}>
            Escolham o plano para o casamento de vocês
          </h2>
          <p className={lead}>
            O Básico não tem mensalidade. Classic e VIP têm pagamento único. As taxas sobre presentes e os recursos incluídos variam
            conforme o plano.
          </p>
        </Reveal>

        <ul className="-mx-4 mt-10 flex snap-x snap-mandatory scroll-pl-4 gap-4 overflow-x-auto px-4 pb-4 pt-3 [scrollbar-width:none] md:mx-0 md:grid md:snap-none md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 lg:mt-14 [&::-webkit-scrollbar]:hidden">
          {COUPLE_PLAN_KEYS.map((key, i) => (
            <Reveal as="li" key={key} delay={i * 100} className="w-[284px] shrink-0 snap-start md:w-auto">
              <CouplePlanCard planKey={key} plan={catalog.plans[key]} />
            </Reveal>
          ))}
        </ul>

        <Reveal delay={150} className="mt-8 flex flex-col gap-6 border-t border-linha pt-8 md:mt-12 md:flex-row md:items-center md:justify-between">
          <p className="max-w-[60ch] text-[15px] leading-6 text-tinta-suave">
            Precisam só de algumas partes?{" "}
            <Link href="/monte-seu-plano" className="font-semibold text-ameixa underline decoration-ameixa/30 underline-offset-4 transition-colors hover:decoration-ameixa">
              Montem o plano de vocês
            </Link>
            . Para ver taxas e condições dos presentes, abram a comparação.
          </p>
          <Link href="/planos" className={cn(btn.secondary, "shrink-0")}>
            Comparar os planos
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================================================ */
/* 10. Convite final                                                                            */
/* ============================================================================================ */

function Closing() {
  return (
    <section aria-labelledby="fim-titulo" className="border-t border-linha">
      <div className={cn(container, "grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-12 lg:gap-10 lg:py-28")}>
        <div className="flex flex-col gap-6 lg:col-span-7">
          <Reveal variant="fade">
            <Overline>Para começar</Overline>
          </Reveal>
          <h2
            id="fim-titulo"
            className="font-display text-[40px] font-normal leading-[46px] tracking-[-0.02em] sm:text-[54px] sm:leading-[60px] lg:text-[64px] lg:leading-[70px]"
          >
            <SplitWords parts={["Comecem pelo ", { em: "site" }, " e pela lista de convidados"]} step={70} />
          </h2>
          <Reveal delay={300}>
            <p className={cn(lead, "max-w-[46ch]")}>
              Criem a conta de vocês e preparem as primeiras informações do casamento. É possível começar pelo plano Básico.
            </p>
          </Reveal>
          <Reveal delay={400} className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Link href="/cadastro?plano=basic" className={btn.primary}>
              Criar conta grátis
              <ArrowRight aria-hidden="true" className={btnArrow} />
            </Link>
            <Link href="/login" className={btn.quiet}>
              Já tenho conta
            </Link>
          </Reveal>
          <Reveal delay={480} variant="fade">
            <p className="text-sm leading-5 text-tinta-suave">Sem mensalidade no Básico. Taxa de {GIFT_FEE_LABEL} por presente recebido.</p>
          </Reveal>
          <Reveal delay={560} variant="fade">
            <p className="font-display text-xl italic leading-7 text-ameixa">Do convite ao grande dia, tudo num só sim.</p>
          </Reveal>
        </div>
        <div className="mx-auto w-full max-w-[300px] lg:col-span-5 lg:max-w-[380px]">
          <Parallax strength={50}>
            <Reveal variant="arch" className="arch zoom-media relative aspect-[4/5] overflow-hidden bg-areia">
              <Image
                src={`${IMG}/img-19-fotografia-pre-wedding.webp`}
                alt="Noivo carregando a noiva nas costas numa estrada entre vinhedos"
                fill
                sizes="(min-width: 1024px) 380px, 300px"
                className="object-cover object-[45%_50%]"
              />
            </Reveal>
          </Parallax>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================================ */

export default async function Home() {
  const catalog = await getCatalog();
  return (
    <div className="overflow-x-clip bg-linho text-tinta">
      <SmoothScroll />
      <ScrollProgress />
      <a
        href="#conteudo"
        className="sr-only z-[80] rounded-[12px] bg-ameixa px-4 py-3 font-semibold text-on-ameixa focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Pular para o conteúdo
      </a>
      <LandingHeader />
      <main id="conteudo">
        <Hero />
        <Functions />
        <HowItWorks />
        <Guests />
        <CoupleSite />
        <Gifts />
        <Liz />
        <MoreFeatures />
        <Vendors />
        <Plans catalog={catalog} />
        <FaqSection />
        <Closing />
      </main>
      <LandingFooter />
    </div>
  );
}
