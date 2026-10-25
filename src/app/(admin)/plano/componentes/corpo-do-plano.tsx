import Link from "next/link";
import { PaymentStatus } from "@prisma/client";
import { ehChaveDePlano } from "@/lib/plans";
import { obterCatalogo } from "@/lib/catalog-server";
import { ID_DO_SUPER_ADMIN } from "@/lib/security/auth-guard";
import { opcaoDePlano, nomeCurtoDoPlano, type OpcaoDePlano } from "@/app/login/auth-config";
import { AvisoDePixEmConferencia, CartoesDoPlano } from "./cartoes-do-plano";
import { carregarDadosDoPlano } from "./dados-do-plano";
import { Recibos } from "./recibos";
import { SecaoDeUpgrade } from "./upgrade/secao-de-upgrade";

/** Ordem dos planos de casal: só mostramos como opção de mudança os que ficam acima do atual. */
const ORDEM_DOS_PLANOS: Record<string, number> = { basic: 0, custom: 1, classic: 2, vip: 3 };
const CHAVES_DE_UPGRADE = ["classic", "vip"] as const;

export async function CorpoDoPlano({ userId, weddingId }: { userId: string; weddingId: string }) {
  const isSuperAdmin = userId === ID_DO_SUPER_ADMIN;
  const catalog = await obterCatalogo();
  const { subscriptions, pendingStatic, gifts } = await carregarDadosDoPlano(weddingId, isSuperAdmin, new Date());
  const nomeDoPlano = (p: { planId: string; planName: string }) => (ehChaveDePlano(p.planId) ? opcaoDePlano(p.planId, catalog).name : nomeCurtoDoPlano(p.planName));

  const current = subscriptions.find((s) => s.status === PaymentStatus.APPROVED) ?? null;
  const currentRank = current ? (ORDEM_DOS_PLANOS[current.planId] ?? 0) : 0;
  const upgrades: OpcaoDePlano[] = CHAVES_DE_UPGRADE.filter((key) => ORDEM_DOS_PLANOS[key] > currentRank).map((key) => opcaoDePlano(key, catalog));
  const awaitingReview = pendingStatic && (ORDEM_DOS_PLANOS[pendingStatic.planId] ?? 0) > currentRank ? pendingStatic : null;

  return (
    <>
      <CartoesDoPlano nome={current ? nomeDoPlano(current) : "Básico"} pago={current} giftCount={gifts._count._all} feeTotal={gifts._sum.fee ?? 0} />
      {awaitingReview ? <AvisoDePixEmConferencia amount={awaitingReview.amount} nomeDoPlano={nomeDoPlano(awaitingReview)} createdAt={awaitingReview.createdAt} /> : null}
      <section aria-labelledby="upgrade-titulo" className="flex flex-col gap-4">
        <h2 id="upgrade-titulo" className="text-xl font-semibold text-tinta">
          Mudar de plano
        </h2>
        <SecaoDeUpgrade plans={upgrades} canPay={!isSuperAdmin} />
        <p className="text-[15px] text-tinta">
          Precisam só de algumas partes?{" "}
          <Link href="/monte-seu-plano" className="inline-flex min-h-11 items-center font-semibold text-ameixa underline-offset-4 hover:underline">
            Montem o plano de vocês
          </Link>
        </p>
      </section>
      <Recibos subscriptions={subscriptions} nomeDoPlano={nomeDoPlano} />
    </>
  );
}
