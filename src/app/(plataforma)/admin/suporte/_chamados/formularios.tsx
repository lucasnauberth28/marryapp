import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Entrada } from "@/components/ui/input";
import { AreaDeTexto } from "@/components/ui/textarea";
import { SelecaoNativa } from "@/components/ui/select";
import { AvisoDoFormulario } from "@/components/ui/field";
import { Botao } from "@/components/ui/button";
import { SITUACOES_DO_CHAMADO, ROTULO_DA_SITUACAO_DO_CHAMADO } from "@/lib/platform/support";
import { criarChamadoDeSuporte, atualizarChamadoDeSuporte } from "@/actions/admin-suporte-actions";
import { useAcaoDoAdmin } from "../../_sistema/use-admin-action";
import type { ItemDeChamado, PreenchimentoDoChamado } from "./tipos";

export function NovoChamado({ prefill, onDone }: { prefill: PreenchimentoDoChamado | null; onDone: () => void }) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [name, setName] = useState(prefill?.requesterName ?? "");
  const [email, setEmail] = useState(prefill?.requesterEmail ?? "");
  const [phone, setPhone] = useState("");
  const { pending, errors, formError, run } = useAcaoDoAdmin();
  return (
    <form
      className="mb-4 flex flex-col gap-4 rounded-2xl bg-linho p-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () => criarChamadoDeSuporte({ subject, body, requesterName: name, requesterEmail: email, requesterPhone: phone, weddingId: prefill?.weddingId, vendorId: prefill?.vendorId }),
          () => {
            onDone();
            router.replace("/admin/suporte#chamados");
            router.refresh();
          },
        );
      }}
    >
      <h3 className="text-lg font-semibold text-tinta">Registrar um pedido de ajuda</h3>
      {prefill && <p className="text-sm text-tinta-suave">Ligado ao {prefill.label}.</p>}
      <Entrada label="Assunto" value={subject} onChange={(e) => setSubject(e.target.value)} error={errors.subject} maxLength={140} />
      <AreaDeTexto label="O que a pessoa contou" optional value={body} onChange={(e) => setBody(e.target.value)} error={errors.body} rows={3} maxLength={2000} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Entrada label="Quem pediu" value={name} onChange={(e) => setName(e.target.value)} error={errors.requesterName} maxLength={120} />
        <Entrada label="E-mail" optional type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.requesterEmail} />
        <Entrada label="Telefone" optional value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.requesterPhone} maxLength={30} />
      </div>
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

function LigacoesDoChamado({ ticket }: { ticket: ItemDeChamado }) {
  if (!ticket.requesterEmail && !ticket.weddingId && !ticket.vendorId) return null;
  return (
    <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-tinta-suave">
      {ticket.requesterEmail && <span>{ticket.requesterEmail}</span>}
      {ticket.weddingId && (
        <Link className="font-semibold text-ameixa underline underline-offset-2" href={`/admin/casais/${ticket.weddingId}`}>
          Abrir o casal
        </Link>
      )}
      {ticket.vendorId && (
        <Link className="font-semibold text-ameixa underline underline-offset-2" href={`/admin/fornecedores?id=${ticket.vendorId}`}>
          Abrir o fornecedor
        </Link>
      )}
    </p>
  );
}

export function EditorDeChamado({ ticket, onDone }: { ticket: ItemDeChamado; onDone: () => void }) {
  const router = useRouter();
  const [status, setStatus] = useState(ticket.status);
  const [note, setNote] = useState(ticket.internalNote ?? "");
  const [assign, setAssign] = useState<"keep" | "me" | "none">("keep");
  const { pending, errors, formError, run } = useAcaoDoAdmin();
  return (
    <form
      className="flex flex-col gap-4 border-t border-linha bg-linho px-4 py-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () => atualizarChamadoDeSuporte({ id: ticket.id, status, internalNote: note, assignToMe: assign === "me", unassign: assign === "none" }),
          () => {
            onDone();
            router.refresh();
          },
        );
      }}
    >
      {ticket.body && <p className="whitespace-pre-line rounded-xl bg-papel p-3 text-sm leading-5 text-tinta">{ticket.body}</p>}
      <LigacoesDoChamado ticket={ticket} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelecaoNativa label="Situação" value={status} onChange={(e) => setStatus(e.target.value as ItemDeChamado["status"])} alwaysFloat>
          {SITUACOES_DO_CHAMADO.map((s) => (
            <option key={s} value={s}>
              {ROTULO_DA_SITUACAO_DO_CHAMADO[s]}
            </option>
          ))}
        </SelecaoNativa>
        <SelecaoNativa label="Responsável" value={assign} onChange={(e) => setAssign(e.target.value as typeof assign)} alwaysFloat>
          <option value="keep">{ticket.assigneeName ? `Continua ${ticket.mine ? "com você" : ticket.assigneeName.split(" ")[0]}` : "Sem responsável"}</option>
          <option value="me">Assumir (eu)</option>
          {ticket.assigneeName && <option value="none">Tirar o responsável</option>}
        </SelecaoNativa>
      </div>
      <AreaDeTexto label="Nota interna" optional hint="Só a equipe vê." value={note} onChange={(e) => setNote(e.target.value)} error={errors.internalNote} rows={3} maxLength={2000} />
      {formError && <AvisoDoFormulario>{formError}</AvisoDoFormulario>}
      <div>
        <Botao type="submit" loading={pending}>
          Salvar
        </Botao>
      </div>
    </form>
  );
}
