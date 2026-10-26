import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert, MailCheck } from "lucide-react";
import { MoldeDeAcesso, FOTOS_DO_MOLDE, TituloDoMolde } from "@/components/account/auth-shell";
import { estiloDoBotao } from "@/components/landing/styles";
import { confirmarEmailPeloLink } from "@/lib/account/email-verification";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Confirmar e-mail",
  robots: { index: false, follow: false },
  // O token está na URL: não deixa vazar no Referer de links externos.
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

/** Abrir o link confirma o e-mail (uma vez só). Quem já usou ou deixou vencer vê como pedir outro. */
export default async function ConfirmarEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const confirmado = await confirmarEmailPeloLink(token);

  return (
    <MoldeDeAcesso photo={FOTOS_DO_MOLDE.senha} backHref="/login" backLabel="Ir para o login">
      <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
        <span className={cn("grid size-14 place-items-center rounded-full", confirmado ? "bg-sucesso-suave text-sucesso" : "bg-aviso-suave text-aviso")}>
          {confirmado ? <MailCheck aria-hidden="true" className="size-7" strokeWidth={1.6} /> : <CircleAlert aria-hidden="true" className="size-7" strokeWidth={1.6} />}
        </span>
        <TituloDoMolde
          title={confirmado ? "E-mail confirmado" : "Este link não vale mais"}
          text={confirmado ? "Pronto, este e-mail é seu. Já pode seguir com o Aceito." : "Ele expirou ou já foi usado. Entre na sua conta e peça outro em Minha conta."}
        />
        <Link href={confirmado ? "/dashboard" : "/login"} className={cn(estiloDoBotao.primary, estiloDoBotao.block, "min-h-12")}>
          {confirmado ? "Abrir o painel" : "Entrar na minha conta"}
        </Link>
      </section>
    </MoldeDeAcesso>
  );
}
