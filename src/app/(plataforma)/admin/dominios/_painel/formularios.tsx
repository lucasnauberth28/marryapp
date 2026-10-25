import { useState } from "react";
import { marcarDominioComoRegistrado, recusarPedidoDeDominio, salvarNotaDoDominio } from "@/actions/dominio-admin/registro";
import { Botao } from "@/components/ui/button";
import { Entrada } from "@/components/ui/input";
import { AreaDeTexto } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ESTILO_DE_PERIGO, hojeNoFormulario, maisUmAno } from "./tipos-e-textos";
import type { PainelDoDominioEstado } from "./use-painel-do-dominio";

interface Propriedades {
  id: string;
  estado: PainelDoDominioEstado;
}

export function FormularioDeRegistro({ id, estado }: Propriedades) {
  const { pending, run, carregando, setPanel } = estado;
  const [registeredAt, setRegisteredAt] = useState(hojeNoFormulario);
  const [expiresAt, setExpiresAt] = useState(() => maisUmAno(hojeNoFormulario()));
  return (
    <form
      className="flex flex-col gap-3 rounded-xl bg-areia p-4"
      onSubmit={(e) => {
        e.preventDefault();
        run("register", () => marcarDominioComoRegistrado({ orderId: id, registeredAt, expiresAt }), () => setPanel(null));
      }}
    >
      <p className="text-sm text-tinta">Ao confirmar, o CPF/CNPJ completo é trocado pela versão escondida e o casal é avisado.</p>
      <Entrada
        label="Data do registro"
        type="date"
        value={registeredAt}
        onChange={(e) => {
          setRegisteredAt(e.target.value);
          if (e.target.value) setExpiresAt(maisUmAno(e.target.value));
        }}
        required
      />
      <Entrada label="Vencimento (1 ano depois)" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} required />
      <div className="flex flex-wrap gap-2">
        <Botao type="submit" disabled={pending} loading={carregando("register")}>
          Confirmar registro
        </Botao>
        <Botao type="button" variant="quiet" onClick={() => setPanel(null)} disabled={pending}>
          Voltar
        </Botao>
      </div>
    </form>
  );
}

export function FormularioDeRecusa({ id, estado }: Propriedades) {
  const { pending, run, carregando } = estado;
  const [reason, setReason] = useState("");
  return (
    <section aria-label="Recusar o pedido" className="flex flex-col gap-3 border-t border-linha pt-4">
      <h3 className="text-[15px] font-semibold text-tinta">Recusar o pedido</h3>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          run("reject", () => recusarPedidoDeDominio({ orderId: id, reason }), () => setReason(""));
        }}
      >
        <AreaDeTexto label="Motivo da recusa" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} hint="O casal recebe este texto por e-mail." />
        <Botao type="submit" variant="outline" disabled={reason.trim().length < 5 || pending} loading={carregando("reject")} className={cn(ESTILO_DE_PERIGO, "self-start")}>
          Recusar com motivo
        </Botao>
      </form>
    </section>
  );
}

export function FormularioDaAnotacao({ id, notaSalva, estado }: Propriedades & { notaSalva: string | null }) {
  const { pending, run, carregando } = estado;
  const [note, setNote] = useState(notaSalva ?? "");
  return (
    <form
      className="flex flex-col gap-2 border-t border-linha pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        run("note", () => salvarNotaDoDominio({ orderId: id, note }));
      }}
    >
      <AreaDeTexto label="Anotação da equipe" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} hint="O casal não vê." />
      <Botao type="submit" variant="outline" size="sm" disabled={note === (notaSalva ?? "") || pending} loading={carregando("note")} className="self-start">
        Salvar anotação
      </Botao>
    </form>
  );
}
