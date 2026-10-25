import { CheckCircle2, Clock, KeyRound, Landmark } from "lucide-react";
import { confirmarContaDeRepasse, removerContaDeRepasse, type RespostaDoRepasse } from "@/actions/payout-actions";
import { Botao } from "@/components/ui/button";
import { Cartao, CabecalhoDoCartao, ConteudoDoCartao, DescricaoDoCartao, TituloDoCartao } from "@/components/ui/card";
import { EtapaDaSenha } from "./etapa-da-senha";
import { formatoDaData, type MascaraDaConta, type ModoDoRecebimento } from "./tipos";

function Informacao({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-sm font-semibold leading-5 text-tinta-suave">{label}</dt>
      <dd className="min-w-0 break-words text-base leading-6 text-tinta">{children}</dd>
    </div>
  );
}

function SituacaoDaConta({ verifiedAt }: { verifiedAt: string | null }) {
  if (verifiedAt) {
    return (
      <span className="inline-flex items-center gap-2 font-semibold text-sucesso">
        <CheckCircle2 className="size-4" aria-hidden="true" />
        Confirmado em {formatoDaData.format(new Date(verifiedAt))}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 font-semibold text-aviso">
      <Clock className="size-4" aria-hidden="true" />
      Falta confirmar que está certo
    </span>
  );
}

interface PropriedadesDoDestino {
  account: MascaraDaConta;
  mode: ModoDoRecebimento;
  readOnly: boolean;
  registrationAvailable: boolean;
  aoMudarModo: (modo: ModoDoRecebimento) => void;
  aoConcluir: (res: RespostaDoRepasse, mensagem: string) => boolean;
}

function AcoesDoDestino({ account, registrationAvailable, aoMudarModo }: Pick<PropriedadesDoDestino, "account" | "registrationAvailable" | "aoMudarModo">) {
  return (
    <div className="flex flex-wrap gap-2">
      {!account.verifiedAt && <Botao onClick={() => aoMudarModo("confirm")}>Confirmar que está certo</Botao>}
      <Botao variant={account.verifiedAt ? "default" : "outline"} onClick={() => aoMudarModo("form")} disabled={!registrationAvailable}>
        Trocar os dados
      </Botao>
      <Botao variant="quiet" onClick={() => aoMudarModo("remove")}>
        Remover
      </Botao>
    </div>
  );
}

function EtapasDaSenha({ mode, aoMudarModo, aoConcluir }: Pick<PropriedadesDoDestino, "mode" | "aoMudarModo" | "aoConcluir">) {
  const voltar = () => aoMudarModo("view");
  if (mode === "confirm") {
    return (
      <EtapaDaSenha
        title="Confirmar os dados"
        help="Ao confirmar, você diz ao Aceito que o destino acima é o certo. Pedimos sua senha para proteger essa decisão."
        submitLabel="Confirmar"
        pendingToast="Confirmando…"
        onCancel={voltar}
        run={(password) => confirmarContaDeRepasse({ password })}
        onDone={(res) => aoConcluir(res, "Dados confirmados.")}
      />
    );
  }
  if (mode !== "remove") return null;
  return (
    <EtapaDaSenha
      title="Remover os dados de recebimento"
      help="Vamos apagar o destino cadastrado, inclusive a parte criptografada. Vocês poderão cadastrar de novo quando quiserem."
      submitLabel="Remover"
      danger
      pendingToast="Removendo…"
      onCancel={voltar}
      run={(password) => removerContaDeRepasse({ password })}
      onDone={(res) => aoConcluir(res, "Dados de recebimento removidos.")}
    />
  );
}

export function DestinoCadastrado({ account, mode, readOnly, registrationAvailable, aoMudarModo, aoConcluir }: PropriedadesDoDestino) {
  return (
    <Cartao className="gap-4">
      <CabecalhoDoCartao>
        <TituloDoCartao>Destino cadastrado</TituloDoCartao>
        <DescricaoDoCartao>Atualizado em {formatoDaData.format(new Date(account.updatedAt))}.</DescricaoDoCartao>
      </CabecalhoDoCartao>
      <ConteudoDoCartao className="flex flex-col gap-5">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Informacao label={account.type === "PIX_KEY" ? "Chave Pix" : "Conta bancária"}>
            <span className="inline-flex items-center gap-2">
              {account.type === "PIX_KEY" ? <KeyRound className="size-4 text-ameixa" aria-hidden="true" /> : <Landmark className="size-4 text-ameixa" aria-hidden="true" />}
              {account.keyHint}
            </span>
          </Informacao>
          <Informacao label="Titular">
            {account.holderName}
            <span className="block text-sm text-tinta-suave">{account.holderDocumentHint}</span>
          </Informacao>
          <Informacao label="Situação">
            <SituacaoDaConta verifiedAt={account.verifiedAt} />
          </Informacao>
        </dl>
        {mode === "view" && !readOnly && <AcoesDoDestino account={account} registrationAvailable={registrationAvailable} aoMudarModo={aoMudarModo} />}
        <EtapasDaSenha mode={mode} aoMudarModo={aoMudarModo} aoConcluir={aoConcluir} />
      </ConteudoDoCartao>
    </Cartao>
  );
}
