import { useState } from "react";
import { useRouter } from "next/navigation";
import { Entrada } from "@/components/ui/input";
import { AreaDeTexto } from "@/components/ui/textarea";
import { SelecaoNativa } from "@/components/ui/select";
import { SeletorDeData } from "@/components/ui/date-picker";
import { AvisoDoFormulario } from "@/components/ui/field";
import { Botao } from "@/components/ui/button";
import { TIPOS_DE_SOLICITACAO_DE_DADOS, ROTULO_DO_TIPO_DE_SOLICITACAO_DE_DADOS } from "@/lib/platform/support";
import { criarSolicitacaoDeDados } from "@/actions/admin-suporte-actions";
import { useAcaoDoAdmin } from "../../_sistema/use-admin-action";
import type { ItemDeSolicitacaoDeDados } from "./tipos";

export function NovaSolicitacao({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [type, setType] = useState<ItemDeSolicitacaoDeDados["type"]>("EXPORT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [receivedOn, setReceivedOn] = useState("");
  const [note, setNote] = useState("");
  const { pending, errors, formError, run } = useAcaoDoAdmin();
  return (
    <form
      className="mb-4 flex flex-col gap-4 rounded-2xl bg-linho p-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => criarSolicitacaoDeDados({ type, requesterName: name, requesterEmail: email, receivedOn, note }), () => {
          onDone();
          router.refresh();
        });
      }}
    >
      <h3 className="text-lg font-semibold text-tinta">Registrar um pedido de titular</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelecaoNativa label="Tipo de pedido" alwaysFloat value={type} onChange={(e) => setType(e.target.value as typeof type)}>
          {TIPOS_DE_SOLICITACAO_DE_DADOS.map((t) => (
            <option key={t} value={t}>
              {ROTULO_DO_TIPO_DE_SOLICITACAO_DE_DADOS[t]}
            </option>
          ))}
        </SelecaoNativa>
        <SeletorDeData label="Recebido em" optional value={receivedOn} onChange={(e) => setReceivedOn(e.target.value)} error={errors.receivedOn} hint="Vazio vale hoje." />
        <Entrada label="Quem pediu" value={name} onChange={(e) => setName(e.target.value)} error={errors.requesterName} maxLength={120} />
        <Entrada label="E-mail da pessoa" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.requesterEmail} hint="Se for o e-mail de uma conta, o pedido se liga a ela." />
      </div>
      <AreaDeTexto label="Observação" optional value={note} onChange={(e) => setNote(e.target.value)} error={errors.note} rows={2} maxLength={2000} />
      {formError && !Object.keys(errors).length && <AvisoDoFormulario>{formError}</AvisoDoFormulario>}
      <div className="flex flex-wrap gap-3">
        <Botao type="submit" loading={pending}>
          Registrar pedido
        </Botao>
        <Botao type="button" variant="quiet" onClick={onDone} disabled={pending}>
          Cancelar
        </Botao>
      </div>
    </form>
  );
}
