import { Check, Clock } from "lucide-react";
import { Selo } from "@/components/painel/seal";
import { EtiquetaDeSituacao } from "@/components/painel/status-chip";
import { BotaoComCarregamento } from "@/components/painel/loading-button";
import { estiloDoBotao, estiloDoCartao, estiloDoSobretitulo } from "@/components/painel/styles";
import type { InformacoesDoConvidadoNaEntrada } from "../lookup-actions";

interface PropriedadesDoConviteLido {
  found: InformacoesDoConvidadoNaEntrada;
  confirming: boolean;
  aoConfirmar: () => void;
  aoVoltar: () => void;
}

function DadosDoConvite({ found }: { found: InformacoesDoConvidadoNaEntrada }) {
  return (
    <dl className="grid w-full grid-cols-2 gap-3 rounded-2xl border border-linha p-4 text-left">
      <div>
        <dt className={estiloDoSobretitulo}>Pessoas</dt>
        <dd className="mt-1 font-num text-[28px] leading-8 text-tinta">{found.people}</dd>
      </div>
      <div>
        <dt className={estiloDoSobretitulo}>Mesa</dt>
        <dd className={`mt-1 font-num text-[28px] leading-8 ${found.table ? "text-ameixa" : "text-tinta-suave"}`}>{found.table ?? "Sem mesa"}</dd>
      </div>
      {found.note && (
        <div className="col-span-2">
          <dt className={estiloDoSobretitulo}>Observação</dt>
          <dd className="mt-1 text-tinta">{found.note}</dd>
        </div>
      )}
    </dl>
  );
}

export function ConviteLido({ found, confirming, aoConfirmar, aoVoltar }: PropriedadesDoConviteLido) {
  return (
    <section className={`${estiloDoCartao} flex flex-col items-center gap-4 p-6 text-center`} aria-label="Convite lido">
      <Selo label={found.alreadyIn ? "Convite já usado" : "Convite válido"} />
      {found.alreadyIn ? (
        <EtiquetaDeSituacao tone="aviso" icon={<Clock className="size-4" aria-hidden="true" />}>
          Entrada já registrada
        </EtiquetaDeSituacao>
      ) : (
        <EtiquetaDeSituacao tone="sucesso" icon={<Check className="size-4" aria-hidden="true" />}>
          Convite válido
        </EtiquetaDeSituacao>
      )}
      <h2 className="font-display text-[34px] font-medium leading-10 text-tinta">{found.name}</h2>
      <DadosDoConvite found={found} />
      <div className="flex w-full flex-col gap-2">
        {!found.alreadyIn && (
          <BotaoComCarregamento onClick={aoConfirmar} loading={confirming} className={`${estiloDoBotao.primary} ${estiloDoBotao.block}`}>
            Registrar entrada de {found.people}
          </BotaoComCarregamento>
        )}
        <button type="button" onClick={aoVoltar} disabled={confirming} className={`${estiloDoBotao.quiet} ${estiloDoBotao.block}`}>
          {found.alreadyIn ? "Voltar" : "Cancelar"}
        </button>
      </div>
    </section>
  );
}
