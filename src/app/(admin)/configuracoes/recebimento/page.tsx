import { Metadata } from "next";
import { CabecalhoDaPagina } from "@/components/admin/page-header";
import { exigirCasamentoNaPagina } from "@/lib/security/wedding-context";
import { recusaDeEscritaNoCasamento } from "@/lib/security/impersonation-rules";
import { ID_DO_SUPER_ADMIN } from "@/lib/security/auth-guard";
import { cifraDoRepasseEstaConfigurada } from "@/lib/security/payout-crypto";
import { obterVisaoDaContaDeRepasse } from "@/lib/payout-account-view";
import { ROTULO_DA_TAXA_DO_PRESENTE } from "@/lib/gift-fee";
import { RecebimentoCliente } from "./recebimento-cliente";

export const metadata: Metadata = {
  title: "Onde receber os presentes",
  description: "Cadastre a chave Pix ou a conta bancária onde o casal quer receber os presentes",
};

export default async function RecebimentoPage() {
  const ctx = await exigirCasamentoNaPagina("/configuracoes");
  const account = await obterVisaoDaContaDeRepasse(ctx.weddingId);

  // Quem pode mexer: só a própria pessoa do casal (a administração vendo o casal, mesmo editando, só lê).
  let blockedReason: string | null = null;
  if (ctx.impersonation || ctx.viaAdmin || ctx.session.userId === ID_DO_SUPER_ADMIN) {
    blockedReason = "Você está vendo este casamento como administração. Só quem é do casal cadastra ou altera os dados de recebimento.";
  } else {
    blockedReason = recusaDeEscritaNoCasamento({ impersonation: ctx.impersonation, suspendedAt: ctx.wedding.suspendedAt });
  }
  const registrationAvailable = cifraDoRepasseEstaConfigurada();

  return (
    <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex max-w-[880px] flex-col gap-6">
        <CabecalhoDaPagina
          eyebrow="Configurações"
          title="Onde receber os presentes"
          description="Diga para onde o Aceito deve enviar o dinheiro dos presentes que vocês recebem pelo site."
        />
        <RecebimentoCliente
          account={
            account
              ? {
                  type: account.type,
                  holderName: account.holderName,
                  holderDocumentHint: account.holderDocumentHint,
                  keyHint: account.keyHint,
                  verifiedAt: account.verifiedAt ? account.verifiedAt.toISOString() : null,
                  updatedAt: account.updatedAt.toISOString(),
                }
              : null
          }
          blockedReason={blockedReason}
          registrationAvailable={registrationAvailable}
          feeLabel={ROTULO_DA_TAXA_DO_PRESENTE}
        />
      </div>
    </div>
  );
}
