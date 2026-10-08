import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Flower2, Gift, Globe, Heart, MapPin, MessageCircle, Store, Users } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Parallax } from "@/components/motion/parallax";
import { ScrollProgress } from "@/components/motion/scroll-progress";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { AnchorLink } from "@/components/landing/anchor-link";
import { FaqSection } from "@/components/landing/faq-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { Seal } from "@/components/landing/seal";
import { SplitWords } from "@/components/landing/split-heading";
import { btn, btnArrow, container, h2, lead, overline } from "@/components/landing/styles";
import { PLANS_CONFIG } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { CountUp, RsvpDemo, ScrollDrift, VendorStrip } from "./home-landing-client";

export const metadata: Metadata = {
  title: { absolute: "Aceito · Do convite ao grande dia, tudo num só sim" },
  description:
    "Site do casal, confirmações pelo WhatsApp, lista de presentes em Pix e os fornecedores certos, num lugar só. Comecem de graça.",
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
/* Hero                                                                                         */
/* ============================================================================================ */

function Hero() {
  return (
    <section aria-labelledby="hero-titulo" className="relative">
      <div className={cn(container, "grid items-center gap-14 pb-16 pt-8 sm:pt-14 lg:grid-cols-12 lg:gap-8 lg:pb-28 lg:pt-16")}>
        <div className="flex flex-col gap-6 lg:col-span-7 lg:pr-6">
          <Reveal variant="fade">
            <Overline>Plataforma de casamento</Overline>
          </Reveal>
          <h1
            id="hero-titulo"
            className="font-display text-[44px] font-normal leading-[48px] tracking-[-0.02em] text-tinta sm:text-[62px] sm:leading-[66px] lg:text-[clamp(64px,6vw,86px)] lg:leading-[1.02]"
          >
            <SplitWords parts={["Do convite ao grande dia, tudo num só ", { em: "sim" }, "."]} baseDelay={120} step={60} />
          </h1>
          <Reveal delay={650}>
            <p className={cn(lead, "max-w-[52ch] lg:text-xl lg:leading-[30px]")}>
              Site do casal, confirmações pelo WhatsApp, lista de presentes em Pix e os fornecedores certos, num lugar só. Vocês
              cuidam do casamento; o Aceito cuida da planilha.
            </p>
          </Reveal>
          <Reveal delay={780} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
            <Link href="/cadastro?plano=basic" className={btn.primary}>
              Criar meu casamento grátis
              <ArrowRight aria-hidden="true" className={btnArrow} />
            </Link>
            <AnchorLink href="/#como" className={btn.secondary}>
              Ver como funciona
            </AnchorLink>
          </Reveal>
          <Reveal delay={880} variant="fade">
            <p className="text-sm text-tinta-suave">Sem cartão de crédito. O plano Básico é gratuito para sempre.</p>
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
                <p className="flex items-center gap-3 whitespace-nowrap text-[15px] font-semibold leading-5 text-tinta">
                  <Seal />
                  Mariana aceitou o convite
                </p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-areia">
                  <div className="h-full w-[61%] origin-left rounded-full bg-sucesso transition-transform delay-[1300ms] duration-[1600ms] ease-[var(--ease-aceito)] [.js_&]:scale-x-0 [.js_[data-revealed]_&]:scale-x-100" />
                </div>
                <p className="mt-2 text-sm text-tinta-suave">
                  <CountUp to={86} delay={1300} /> de 140 confirmados
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
/* Faixa de recursos que desliza com a rolagem                                                   */
/* ============================================================================================ */

const FEATURES = [
  "Site do casal",
  "Confirmações pelo WhatsApp",
  "Lista de presentes em Pix",
  "QR Code na portaria",
  "Mural de recados",
  "Álbum coletivo ao vivo",
  "Fornecedores com curadoria",
  "A Madrinha",
];

function FeatureBand() {
  return (
    <section aria-label="O que vem no Aceito" className="overflow-hidden border-y border-linha py-5 sm:py-7">
      <ScrollDrift distance={360}>
        <ul className="flex w-max items-center gap-7 whitespace-nowrap pl-4 font-display text-2xl leading-8 text-tinta sm:gap-10 sm:pl-6 sm:text-[30px] sm:leading-9">
          {[...FEATURES, ...FEATURES].map((f, i) => (
            <li key={`${f}-${i}`} aria-hidden={i >= FEATURES.length || undefined} className="flex items-center gap-7 sm:gap-10">
              {f}
              <ArchGlyph className="text-champanhe" />
            </li>
          ))}
        </ul>
      </ScrollDrift>
    </section>
  );
}

/* ============================================================================================ */
/* Como funciona                                                                                */
/* ============================================================================================ */

const STEPS = [
  {
    title: "Montem o site de vocês",
    text: "Escolham as fotos, a história e a cor. A prévia muda enquanto vocês editam, no celular e no computador.",
    img: "img-04-cerimonia.webp",
    alt: "Corredor de cerimônia ao ar livre com pétalas e cadeiras de madeira",
    chip: (
      <>
        <Globe aria-hidden="true" className="size-4 text-ameixa" strokeWidth={2} />
        Site publicado
        <Check aria-hidden="true" className="ml-auto size-4 text-sucesso" strokeWidth={2.25} />
      </>
    ),
  },
  {
    title: "Convidem pelo WhatsApp",
    text: "Cada convidado recebe um link, acha o próprio nome e responde em dois toques. Sem cadastro, sem senha.",
    img: "img-14-fotografia-detalhes.webp",
    alt: "Convite em papel, alianças e sapatos da noiva sobre linho",
    chip: (
      <>
        <MessageCircle aria-hidden="true" className="size-4 text-sucesso" strokeWidth={2} />
        Convite enviado para 140 pessoas
      </>
    ),
  },
  {
    title: "Acompanhem tudo num painel",
    text: "Quem confirmou, quem falta, quanto entrou em presentes e o que vem a seguir, em uma tela.",
    img: "img-05-recepcao.webp",
    alt: "Salão de recepção com mesas postas e luzes suspensas",
    chip: (
      <>
        <Users aria-hidden="true" className="size-4 text-ameixa" strokeWidth={2} />
        86 confirmados · 32 sem resposta
      </>
    ),
  },
];

function HowItWorks() {
  return (
    <section id="como" aria-labelledby="como-titulo" className="border-b border-linha bg-papel py-16 sm:py-24 lg:py-28">
      <div className={container}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <Reveal className="flex max-w-[640px] flex-col gap-4">
            <Overline>Como funciona</Overline>
            <h2 id="como-titulo" className={h2}>
              Três passos, e o resto fica leve.
            </h2>
          </Reveal>
          <Reveal delay={120} className="max-w-[38ch]">
            <p className={lead}>Comecem pelo site, convidem pelo WhatsApp e acompanhem tudo de um lugar só.</p>
          </Reveal>
        </div>

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
      </div>
    </section>
  );
}

/* ============================================================================================ */
/* O site do casal: momento de galeria                                                          */
/* ============================================================================================ */

const SITE_POINTS = [
  { icon: Heart, text: "Fotos e a história de como tudo começou" },
  { icon: Gift, text: "Lista de presentes com Pix e cartão" },
  { icon: MapPin, text: "Local, horário e guia de trajes" },
];

function CoupleSite() {
  return (
    <section aria-labelledby="site-titulo" className="py-16 sm:py-24 lg:py-32">
      <div className={cn(container, "grid gap-14 lg:grid-cols-12 lg:items-center lg:gap-10")}>
        <div className="flex flex-col gap-5 lg:col-span-5 lg:pr-8">
          <Reveal variant="fade">
            <Overline>O site do casal</Overline>
          </Reveal>
          <h2 id="site-titulo" className={h2}>
            <SplitWords parts={["A história de vocês, contada com ", { em: "calma" }, "."]} step={55} />
          </h2>
          <Reveal delay={200}>
            <p className={lead}>
              Um endereço só para mandar a todos os convidados, com cara de papelaria fina: fotos, o local, o traje e a lista
              de presentes.
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
/* Para os convidados                                                                           */
/* ============================================================================================ */

const GUEST_POINTS = [
  "Lembretes automáticos para quem ainda não respondeu",
  "Restrições alimentares e acompanhantes no mesmo passo",
  "QR Code de entrada no dia, conferido na portaria",
];

function Guests() {
  return (
    <section id="convidados" aria-labelledby="convidados-titulo" className="border-t border-linha bg-areia/45 py-16 sm:py-24 lg:py-28">
      <div className={cn(container, "grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-10")}>
        <div className="flex flex-col gap-5 lg:order-2 lg:col-span-6 lg:pl-10">
          <Reveal className="flex flex-col gap-4">
            <Overline>Para os convidados</Overline>
            <h2 id="convidados-titulo" className={h2}>
              O convite que se responde em dois toques.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className={lead}>
              O convidado digita o nome, vê só o convite dele, com os lugares que vocês reservaram, e responde. Vocês recebem a
              confirmação na hora, e ele recebe os detalhes no WhatsApp.
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
/* Madrinha                                                                                     */
/* ============================================================================================ */

const MADRINHA_POINTS = ["Lembretes para quem não respondeu", "Cronograma do grande dia", "Mensagens de agradecimento"];

function Madrinha() {
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
              Conheça a Madrinha
            </p>
          </Reveal>
          <h2 id="madrinha-titulo" className={cn(h2, "text-on-ameixa")}>
            <SplitWords parts={["Uma assistente que lembra de tudo por vocês."]} step={55} />
          </h2>
          <Reveal delay={200}>
            <p className="max-w-[48ch] text-[17px] leading-[26px] text-on-ameixa/90 sm:text-lg sm:leading-7">
              A Madrinha olha o painel de vocês e sugere o próximo passo: o lembrete para quem não respondeu, o cronograma do dia,
              a mensagem de agradecimento. Ela prepara; vocês aprovam.
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
            <AnchorLink href="/#planos" className={cn(btn.onAmeixa, "max-sm:w-full")}>
              Ver os planos com a Madrinha
              <ArrowRight aria-hidden="true" className={btnArrow} />
            </AnchorLink>
          </Reveal>
        </div>

        <div className="relative flex flex-col gap-4 text-tinta sm:pl-10 lg:pl-6">
          {/* Cartão de fundo: rascunho do cronograma */}
          <div className="ml-auto w-[88%] max-w-[340px] sm:mr-4">
            <Parallax strength={30}>
              <Reveal variant="right" delay={150}>
                <div aria-hidden="true" className="rounded-[16px] border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-1)]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">Rascunho do cronograma</p>
                    <span className="inline-flex min-h-7 shrink-0 items-center whitespace-nowrap rounded-[6px] bg-aviso-suave px-2.5 text-sm font-semibold text-aviso">
                      Para revisar
                    </span>
                  </div>
                  <ul className="mt-4 flex flex-col gap-2.5 text-sm">
                    {[
                      ["15h30", "Chegada dos convidados"],
                      ["16h", "Cerimônia"],
                      ["17h30", "Recepção e jantar"],
                    ].map(([t, label]) => (
                      <li key={t} className="flex items-center gap-3">
                        <span className="w-12 shrink-0 font-semibold tabular-nums text-ameixa">{t}</span>
                        <span className="h-px w-3 bg-linha" />
                        <span className="text-tinta-suave">{label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </Parallax>
          </div>

          {/* Cartão principal: sugestão da Madrinha */}
          <div className="relative -mt-10 w-full max-w-[480px] sm:-mt-6">
            <Parallax strength={60}>
              <Reveal variant="up" delay={300}>
                <aside
                  aria-label="Exemplo de sugestão da Madrinha"
                  className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 rounded-[16px] border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-2)] sm:p-6"
                >
                  <span className="grid h-[52px] w-10 place-items-center rounded-[999px_999px_6px_6px] bg-salvia-suave text-salvia">
                    <Flower2 aria-hidden="true" className="size-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold leading-5">
                      Madrinha <span className="font-normal text-tinta-suave">· sua assistente</span>
                    </p>
                    <p className="mt-1 text-base leading-6">
                      32 convidados ainda não responderam e o prazo é em nove dias. Quer que eu prepare uma mensagem de lembrete
                      para mandar no WhatsApp?
                    </p>
                  </div>
                  <div aria-hidden="true" className="col-start-2 flex flex-wrap gap-2">
                    <span className={cn(btn.primary, btn.sm, "pointer-events-none")}>Preparar mensagem</span>
                    <span className={cn(btn.quiet, btn.sm, "pointer-events-none")}>Agora não</span>
                  </div>
                </aside>
              </Reveal>
            </Parallax>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================================ */
/* Fornecedores                                                                                 */
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
            Aceito para Fornecedores
          </p>
          <h2 id="fornecedores-titulo" className={h2}>
            Fotógrafos, buffets e espaços que mostram o trabalho e o preço.
          </h2>
          <p className={lead}>
            Os casais encontram quem atende na região deles e pedem orçamento direto pela plataforma. Fornecedores entram de graça,
            com curadoria.
          </p>
        </Reveal>
        <Reveal delay={150} className="flex shrink-0 flex-col gap-2 sm:flex-row sm:gap-3">
          <Link href="/fornecedores" className={btn.primary}>
            Encontrar fornecedores
            <ArrowRight aria-hidden="true" className={btnArrow} />
          </Link>
          <Link href="/cadastro?plano=start" className={btn.secondary}>
            Sou fornecedor
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
/* Planos                                                                                       */
/* ============================================================================================ */

const reais = (cents: number) => `R$ ${(cents / 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;

const COUPLE_PLANS = [
  { key: "basic", summary: "Para começar com o essencial.", cta: "Começar grátis" },
  { key: "classic", summary: "Para deixar tudo no automático.", cta: "Escolher o Classic" },
  { key: "vip", summary: "Para a experiência completa.", cta: "Escolher o VIP" },
] as const;

function Plans() {
  return (
    <section id="planos" aria-labelledby="planos-titulo" className="py-16 sm:py-24 lg:py-28">
      <div className={container}>
        <Reveal className="flex max-w-[680px] flex-col gap-4">
          <Overline>Planos para casais</Overline>
          <h2 id="planos-titulo" className={h2}>
            Comecem de graça. Paguem uma vez, se quiserem mais.
          </h2>
        </Reveal>

        <ul className="-mx-4 mt-10 flex snap-x snap-mandatory scroll-pl-4 gap-4 overflow-x-auto px-4 pb-4 pt-3 [scrollbar-width:none] md:mx-0 md:grid md:snap-none md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 lg:mt-14 [&::-webkit-scrollbar]:hidden">
          {COUPLE_PLANS.map(({ key, summary, cta }, i) => {
            const plan = PLANS_CONFIG[key];
            const popular = key === "classic";
            return (
              <Reveal
                as="li"
                key={key}
                delay={i * 100}
                className="w-[284px] shrink-0 snap-start md:w-auto"
              >
                <article
                  className={cn(
                    "lift flex h-full flex-col rounded-[16px] bg-papel p-6 shadow-[var(--shadow-aceito-1)] lg:p-8",
                    popular ? "border-2 border-ameixa" : "border border-linha",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-semibold leading-7">{plan.name.replace(/^Plano /, "")}</h3>
                    {popular ? (
                      <span className="inline-flex min-h-7 items-center rounded-[6px] bg-ameixa-suave px-2.5 text-sm font-semibold text-ameixa">
                        Mais escolhido
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[15px] text-tinta-suave">{summary}</p>
                  <p className="mt-5 flex items-baseline gap-2">
                    <span className="font-display text-[44px] leading-[48px] tracking-[-0.01em]">{plan.price === 0 ? "Grátis" : reais(plan.price)}</span>
                    <span className="text-[15px] text-tinta-suave">{plan.price === 0 ? "para sempre" : "uma vez"}</span>
                  </p>
                  <ul className="mt-6 flex flex-1 flex-col gap-3 border-t border-linha pt-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-[15px] leading-[22px]">
                        <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sucesso" strokeWidth={2.25} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/cadastro?plano=${key}`}
                    className={cn(popular ? btn.primary : btn.secondary, btn.block, "mt-8")}
                    aria-label={`${cta}: plano ${plan.name.replace(/^Plano /, "")}`}
                  >
                    {cta}
                  </Link>
                </article>
              </Reveal>
            );
          })}
        </ul>

        <Reveal delay={150} className="mt-8 flex flex-col gap-6 border-t border-linha pt-8 md:mt-12 md:flex-row md:items-center md:justify-between">
          <p className="max-w-[60ch] text-[15px] leading-6 text-tinta-suave">
            Precisa só de algumas partes?{" "}
            <Link href="/monte-seu-plano" className="font-semibold text-ameixa underline decoration-ameixa/30 underline-offset-4 transition-colors hover:decoration-ameixa">
              Montem o plano de vocês
            </Link>
            . É fornecedor? O plano Start é gratuito, e o Pro sai por {reais(PLANS_CONFIG.pro.price)} por mês.
          </p>
          <Link href="/cadastro" className={cn(btn.secondary, "shrink-0")}>
            Comparar os planos
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================================================ */
/* Fechamento                                                                                   */
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
            className="font-display text-[44px] font-normal leading-[48px] tracking-[-0.02em] sm:text-[60px] sm:leading-[64px] lg:text-[72px] lg:leading-[76px]"
          >
            <SplitWords parts={["Prontos para o primeiro ", { em: "sim" }, "?"]} step={70} />
          </h2>
          <Reveal delay={300}>
            <p className={cn(lead, "max-w-[46ch]")}>
              Criem o casamento em poucos minutos e mandem o primeiro convite ainda hoje. O plano Básico é gratuito para sempre.
            </p>
          </Reveal>
          <Reveal delay={400} className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Link href="/cadastro?plano=basic" className={btn.primary}>
              Criar meu casamento grátis
              <ArrowRight aria-hidden="true" className={btnArrow} />
            </Link>
            <Link href="/login" className={btn.quiet}>
              Já tenho conta
            </Link>
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

export default function Home() {
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
        <FeatureBand />
        <HowItWorks />
        <CoupleSite />
        <Guests />
        <Madrinha />
        <Vendors />
        <Plans />
        <FaqSection />
        <Closing />
      </main>
      <LandingFooter />
    </div>
  );
}
