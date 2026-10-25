import { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { requireWeddingPage } from "@/lib/security/wedding-context";
import { weddingWriteRefusal } from "@/lib/security/impersonation-rules";
import { SUPER_ADMIN_USER_ID } from "@/lib/security/auth-guard";
import { isPayoutCryptoConfigured } from "@/lib/security/payout-crypto";
import { obterVisaoDaContaDeRepasse } from "@/lib/payout-account-view";
import { ROTULO_DA_TAXA_DO_PRESENTE } from "@/lib/gift-fee";
import { RecebimentoClient } from "./recebimento-client";

export const metadata: Metadata = {
  title: "Onde receber os presentes",
  description: "Cadastre a chave Pix ou a conta bancária onde o casal quer receber os presentes",
};

export default async function RecebimentoPage() {
  const ctx = await requireWeddingPage("/configuracoes");
  const account = await obterVisaoDaContaDeRepasse(ctx.weddingId);

  // Quem pode mexer: só a própria pessoa do casal (a administração vendo o casal, mesmo editando, só lê).
  let blockedReason: string | null = null;
  if (ctx.impersonation || ctx.viaAdmin || ctx.session.userId === SUPER_ADMIN_USER_ID) {
    blockedReason = "Você está vendo este casamento como administração. Só quem é do casal cadastra ou altera os dados de recebimento.";
  } else {
    blockedReason = weddingWriteRefusal({ impersonation: ctx.impersonation, suspendedAt: ctx.wedding.suspendedAt });
  }
  const registrationAvailable = isPayoutCryptoConfigured();

  return (
    <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex max-w-[880px] flex-col gap-6">
        <PageHeader
          eyebrow="Configurações"
          title="Onde receber os presentes"
          description="Diga para onde o Aceito deve enviar o dinheiro dos presentes que vocês recebem pelo site."
        />
        <RecebimentoClient
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
