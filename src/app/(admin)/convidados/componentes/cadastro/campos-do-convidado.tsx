import { formatarTelefone } from "@/lib/formatacao/telefone";
import { SelecaoNativa } from "@/components/ui/select";
import { SituacaoDaConfirmacao, type ConvidadoLocal } from "@/types/local";
import { CATEGORIAS_DE_CONVIDADO } from "../tipos";
import { CampoDoModalDoConvidado } from "./campo-do-modal";
import { SeletorDeLugares } from "./seletor-de-lugares";
import type { CamposDoConvidado } from "./use-campos-do-convidado";

export function DadosDoConvidado({ guest }: { guest?: ConvidadoLocal | null }) {
  return (
    <>
      <CampoDoModalDoConvidado
        label="Nome no convite"
        name="name"
        placeholder="Ex.: Família Teixeira"
        autoComplete="off"
        defaultValue={guest?.name}
        hint="É assim que a pessoa vai se encontrar no convite."
        required
      />
      <CampoDoModalDoConvidado
        label="WhatsApp"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="off"
        hint="Com DDD, por exemplo (11) 99999-8888. Serve para enviar convites e lembretes pelo WhatsApp, nos planos que incluem esse envio."
        placeholder="(11) 90000-0000"
        defaultValue={guest?.phone ? formatarTelefone(guest.phone) : ""}
      />
      <CampoDoModalDoConvidado label="E-mail (opcional)" name="email" type="email" inputMode="email" autoComplete="off" placeholder="nome@exemplo.com" defaultValue={guest?.email ?? ""} />
    </>
  );
}

export function GrupoELugares({ form }: { form: CamposDoConvidado }) {
  const { category } = form;
  return (
    <>
      <SeletorDeLugares id={form.ids.seats} lugares={form.seats} aoMudar={(atualizar) => form.mudar("seats", atualizar(form.seats))} />
      <div className="grid gap-5">
        <SelecaoNativa id={form.ids.category} label="Grupo" value={category} onChange={(e) => form.mudar("category", e.target.value)}>
          <option value=""></option>
          {category && !CATEGORIAS_DE_CONVIDADO.some((c) => c === category) && <option value={category}>{category}</option>}
          {CATEGORIAS_DE_CONVIDADO.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </SelecaoNativa>
        <SelecaoNativa id={form.ids.parent} label="Vem junto com outro convidado?" value={form.parentGuestId} onChange={(e) => form.mudar("parentGuestId", e.target.value)}>
          {form.parentOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelecaoNativa>
      </div>
    </>
  );
}

/** Só na edição: a resposta do convidado e os dados que ele mesmo informa ao responder. */
export function RespostaDoConvidado({ guest, form }: { guest?: ConvidadoLocal | null; form: CamposDoConvidado }) {
  return (
    <>
      <SelecaoNativa
        id={form.ids.rsvp}
        label="Resposta do convidado"
        hint="O convidado responde pelo link do convite. Mudem aqui só se ele avisou por outro meio."
        value={form.rsvpStatus}
        onChange={(e) => form.mudar("rsvpStatus", e.target.value as SituacaoDaConfirmacao)}
      >
        <option value={SituacaoDaConfirmacao.PENDING}>Sem resposta</option>
        <option value={SituacaoDaConfirmacao.CONFIRMED}>Confirmado</option>
        <option value={SituacaoDaConfirmacao.DECLINED}>Não vai</option>
      </SelecaoNativa>
      {form.rsvpStatus === SituacaoDaConfirmacao.CONFIRMED ? (
        <CampoDoModalDoConvidado label="Restrições alimentares" name="dietaryRestrictions" placeholder="Sem glúten, vegano..." defaultValue={guest?.dietaryRestrictions ?? ""} />
      ) : (
        <input type="hidden" name="dietaryRestrictions" value={guest?.dietaryRestrictions ?? ""} />
      )}
      {/* Dados que o convidado informa ao responder: seguem como estão ao salvar */}
      <input type="hidden" name="confirmedCompanions" value={guest?.confirmedCompanions ?? 0} />
      <input type="hidden" name="companionsNames" value={guest?.companionsNames ?? ""} />
    </>
  );
}
