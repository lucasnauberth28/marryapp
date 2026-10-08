import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Reveal } from "@/components/motion/reveal";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre para continuar organizando o casamento no Aceito.",
};

const PHOTO = "/images/aceito/img-21-papelaria.webp";
const PHOTO_ALT = "Convite em papel algodão com envelope ameixa e selo de cera";

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh bg-linho text-tinta">
      {/* Coluna do formulário */}
      <div className="flex min-w-0 flex-1 flex-col lg:px-[clamp(24px,5vw,80px)] lg:py-8">
        {/* Cabeçalho: no celular com voltar; no computador só a marca */}
        <header className="flex h-16 items-center gap-1 px-2 lg:h-auto lg:px-0">
          <Link
            href="/"
            aria-label="Voltar para o início"
            className="grid size-11 place-items-center rounded-[12px] text-tinta transition-colors hover:bg-areia lg:hidden"
          >
            <ArrowLeft aria-hidden="true" className="size-5" strokeWidth={1.75} />
          </Link>
          <Link href="/" aria-label="Aceito, início" className="-m-2 rounded-[12px] p-2 transition-opacity hover:opacity-80">
            <Logo height={24} priority className="lg:hidden" />
            <Logo height={28} priority className="hidden lg:block" />
          </Link>
        </header>

        {/* Faixa de foto no celular */}
        <Reveal variant="fade" className="relative mx-4 h-40 overflow-hidden rounded-[16px] bg-areia sm:h-52 lg:hidden">
          <Image src={PHOTO} alt={PHOTO_ALT} fill preload sizes="(min-width: 1024px) 1px, 100vw" className="object-cover object-[50%_45%]" />
        </Reveal>

        <main id="conteudo" className="flex w-full max-w-[420px] flex-1 flex-col justify-center px-4 pb-8 pt-6 sm:mx-auto lg:mx-0 lg:px-0 lg:py-12">
          <Reveal className="flex flex-col gap-2">
            <h1 className="font-display text-[34px] font-normal leading-10 tracking-[-0.015em] lg:text-[44px] lg:leading-[50px]">
              Que bom ver vocês
            </h1>
            <p className="text-base leading-6 text-tinta-suave">Entrem para continuar organizando o casamento.</p>
          </Reveal>

          <Reveal delay={100} className="mt-6 hidden lg:block">
            <div role="navigation" aria-label="Acesso" className="grid grid-cols-2 gap-1 rounded-[12px] bg-areia p-1">
              <span
                aria-current="page"
                className="flex min-h-11 items-center justify-center rounded-[10px] bg-papel font-semibold text-tinta shadow-[var(--shadow-aceito-1)]"
              >
                Entrar
              </span>
              <Link
                href="/assinar"
                className="flex min-h-11 items-center justify-center rounded-[10px] font-semibold text-tinta-suave transition-colors duration-200 hover:bg-papel/60 hover:text-tinta"
              >
                Criar conta
              </Link>
            </div>
          </Reveal>

          <Reveal delay={180} className="mt-6">
            <LoginForm />
          </Reveal>
        </main>

        <p className="hidden pb-2 text-sm text-tinta-suave lg:block">Convidado? Você não precisa de conta: use o link do convite.</p>
        <p className="px-4 pb-8 text-center text-sm text-tinta-suave lg:hidden">
          Convidado? Você não precisa de conta: use o link do convite.
        </p>
      </div>

      {/* Painel da foto no computador */}
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden border-l border-linha bg-areia lg:flex">
        <div className="relative w-[min(420px,64%)]">
          <Reveal variant="fade" delay={700} className="arch pointer-events-none absolute -inset-2.5 border border-champanhe">
            <span aria-hidden="true" />
          </Reveal>
          <Reveal variant="arch" delay={120} className="arch relative aspect-[2/3] overflow-hidden bg-papel">
            <Image
              src={PHOTO}
              alt={PHOTO_ALT}
              fill
              sizes="(min-width: 1024px) 420px, 1px"
              className="object-cover transition-transform duration-[2400ms] ease-[var(--ease-aceito)] [.js_&]:scale-[1.08] [.js_[data-revealed]_&]:scale-100"
            />
          </Reveal>
        </div>
        <p className="absolute inset-x-0 bottom-8 text-center font-display text-2xl text-tinta-suave">
          Do convite ao grande dia.
        </p>
      </div>
    </div>
  );
}
