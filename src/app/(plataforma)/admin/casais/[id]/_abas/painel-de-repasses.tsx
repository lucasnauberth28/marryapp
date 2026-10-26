import { Painel } from "@/components/plataforma/panel";
import { Aviso } from "@/components/plataforma/notices";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { formatarDataEHora } from "@/lib/platform/format";
import { obterVisaoDaContaDeRepasse } from "@/lib/repasse/payout-account-view";
import { obterLivroDeRepasses } from "@/lib/repasse/payout-ledger-server";
import { FormularioDeRepasse } from "../_components/payout-form";
import { LinhasDoDetalhe } from "./linhas-do-detalhe";

/** Quanto do que os convidados presentearam já foi para o casal e quanto falta. Só quem é da administração chega aqui. */
export async function PainelDeRepasses({ weddingId }: { weddingId: string }) {
  const [{ saldo, posicao, payouts }, conta] = await Promise.all([obterLivroDeRepasses(weddingId), obterVisaoDaContaDeRepasse(weddingId)]);
  const destinoConfirmado = Boolean(conta?.verifiedAt);
  return (
    <Painel title="Repasse dos presentes" aside={<EtiquetaDeSituacao tone={posicao.dueCents > 0 ? "aviso" : "neutro"}>{posicao.dueCents > 0 ? "Há saldo a repassar" : "Sem saldo a repassar"}</EtiquetaDeSituacao>}>
      <LinhasDoDetalhe
        items={[
          { label: "Presentes recebidos", value: `${formatarReais(saldo.grossCents)} (${saldo.approvedCount})` },
          { label: "Taxa do Aceito", value: formatarReais(saldo.feeCents) },
          { label: "Líquido do casal", value: formatarReais(posicao.netCents) },
          { label: "Já repassado", value: formatarReais(posicao.paidOutCents) },
          { label: "Falta repassar", value: <strong className="font-semibold">{formatarReais(posicao.dueCents)}</strong> },
          ...(saldo.toCheckCount > 0 ? [{ label: "Pix a conferir", value: `${formatarReais(saldo.toCheckCents)} (${saldo.toCheckCount}), só entra no saldo depois de confirmado` }] : []),
        ]}
      />
      {posicao.overpaidCents > 0 ? (
        <Aviso tone="aviso" className="mt-4">
          Foi repassado {formatarReais(posicao.overpaidCents)} a mais que o líquido de hoje (algum presente foi estornado depois do repasse). Confira com o casal antes do próximo.
        </Aviso>
      ) : null}
      {posicao.dueCents > 0 && destinoConfirmado ? <div className="mt-5"><FormularioDeRepasse key={posicao.dueCents} weddingId={weddingId} dueCents={posicao.dueCents} /></div> : null}
      {posicao.dueCents > 0 && !destinoConfirmado ? <Aviso tone="neutro" className="mt-4">Só dá para registrar o repasse quando o casal cadastrar e confirmar onde quer receber.</Aviso> : null}
      {payouts.length > 0 ? (
        <ul className="mt-5 flex flex-col gap-2 border-t border-linha pt-4">
          {payouts.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                <strong className="font-semibold">{formatarReais(p.amountCents)}</strong> em {formatarDataEHora(p.paidAt)}, por {p.registeredBy}
                {p.reference ? ` · ${p.reference}` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </Painel>
  );
}
