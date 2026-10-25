import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Logotipo } from "@/components/brand/logo";
import { obterSessao, ID_DO_SUPER_ADMIN, redirecionarParaOLogin } from "@/lib/security/auth-guard";
import { chavePublicaVapid } from "@/lib/notifications/push";
import { SecoesDaConta } from "./account-sections";
import { buscarPessoaDaConta, destinoDoPainel, propriedadesDaConta } from "./dados";

export const metadata: Metadata = {
  title: "Minha conta",
  description: "Senha, convite do par, seus dados e exclusão da conta.",
  robots: { index: false, follow: false },
};

const ROTULO_DO_TIPO = { couple: "Conta de casal", vendor: "Conta de fornecedor", admin: "Conta da administração" } as const;

function CabecalhoDaConta({ panelHref }: { panelHref: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-linha bg-linho/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[880px] items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" aria-label="Aceito, início" className="-m-2 rounded-[12px] p-2 transition-opacity hover:opacity-80">
          <Logotipo height={26} priority />
        </Link>
        <Link href={panelHref} className="inline-flex min-h-11 items-center gap-2 rounded-[12px] px-3 text-[15px] font-semibold text-ameixa transition-colors hover:bg-ameixa-suave">
          <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={2} />
          Voltar ao painel
        </Link>
      </div>
    </header>
  );
}

export default async function ContaPage() {
  const session = await obterSessao();
  if (!session) return redirecionarParaOLogin();
  if (session.userId === ID_DO_SUPER_ADMIN) redirect("/admin");

  const user = await buscarPessoaDaConta(session.userId, new Date());
  if (!user) redirect("/login");
  const { kind, props } = await propriedadesDaConta(user, chavePublicaVapid());

  return (
    <div className="min-h-dvh bg-linho text-tinta">
      <CabecalhoDaConta panelHref={destinoDoPainel(kind, user, session.allowedPaths)} />

      <main id="conteudo" className="page-in mx-auto flex w-full max-w-[880px] flex-col gap-8 px-4 pb-16 pt-8 sm:px-6 md:pt-12">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">{ROTULO_DO_TIPO[kind]}</p>
          <h1 className="font-display text-[32px] leading-[38px] tracking-[-0.01em] text-balance md:text-[40px] md:leading-[46px]">Minha conta</h1>
          <p className="text-[15px] text-tinta-suave">
            {user.name} · {user.username}
          </p>
        </div>

        <SecoesDaConta {...props} />
      </main>
    </div>
  );
}
