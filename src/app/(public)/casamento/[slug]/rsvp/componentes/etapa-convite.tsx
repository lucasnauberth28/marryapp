import { CalendarDays, MapPin } from "lucide-react";
import { Botao } from "@/components/ui/button";
import { Campo, AvisoDoFormulario } from "@/components/ui/field";
import { Entrada } from "@/components/ui/input";
import { SelecaoNativa } from "@/components/ui/select";
import { estiloDoSobretitulo, type ConvidadoDaConfirmacao, type PropriedadesDaEtapa } from "./tipos";
import type { Confirmacao } from "./use-confirmacao";

interface PropriedadesDoCartao {
  guest: ConvidadoDaConfirmacao;
  coupleNames: string;
  dateLabel: string | null;
  locationName: string | null;
}

function CartaoDoConvite({ titulo, guest, coupleNames, dateLabel, locationName }: PropriedadesDoCartao & PropriedadesDaEtapa) {
  const firstName = guest.name.trim().split(/\s+/)[0] ?? "";
  const seats = guest.allowedCompanions + 1;
  return (
    <div className="relative rounded-[16px] border border-linha bg-papel px-5 pb-6 pt-8 text-center shadow-[var(--shadow-aceito-2)]">
      <span aria-hidden="true" className="pointer-events-none absolute inset-2 rounded-[10px] border border-rosa" />
      <div className="relative">
        <p className={estiloDoSobretitulo}>Seu convite chegou</p>
        <h1 ref={titulo} id="titulo" tabIndex={-1} className="mb-1 mt-2 font-display text-[36px] font-medium leading-[42px] tracking-[-0.015em] text-balance text-tinta outline-none">
          {coupleNames}
        </h1>
        {dateLabel || locationName ? (
          <div className="mt-4 flex flex-col gap-1 text-sm leading-5 text-tinta-suave">
            {dateLabel ? (
              <span className="inline-flex items-center justify-center gap-2">
                <CalendarDays aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.6} />
                {dateLabel}
              </span>
            ) : null}
            {locationName ? (
              <span className="inline-flex items-center justify-center gap-2">
                <MapPin aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.6} />
                {locationName}
              </span>
            ) : null}
          </div>
        ) : null}
        <p className="mt-6">
          {firstName}, guardamos <strong className="font-semibold">{seats === 1 ? "1 lugar" : `${seats} lugares`}</strong> para você.
        </p>
        {guest.allowedCompanions > 0 ? <p className="mt-1 text-sm text-tinta-suave">Isso inclui você e mais {guest.allowedCompanions === 1 ? "1 acompanhante" : `${guest.allowedCompanions} acompanhantes`}.</p> : null}
      </div>
    </div>
  );
}

function EscolhaDeAcompanhantes({ guest, a }: { guest: ConvidadoDaConfirmacao; a: Confirmacao["acompanhantes"] }) {
  return (
    <>
      <SelecaoNativa id="rsvp-acompanhantes" label="Além de você, quantos acompanhantes?" value={a.count} onChange={(e) => a.setCount(Number(e.target.value))}>
        {Array.from({ length: guest.allowedCompanions + 1 }).map((_, i) => (
          <option key={i} value={i}>
            {i === 0 ? "Nenhum acompanhante" : i === 1 ? "1 acompanhante" : `${i} acompanhantes`}
          </option>
        ))}
      </SelecaoNativa>
      {a.count > 0 ? (
        <fieldset className="flex flex-col gap-5">
          <legend className="mb-3 text-sm font-semibold leading-5 text-tinta">Nome de cada acompanhante</legend>
          {Array.from({ length: a.count }).map((_, i) => (
            <Entrada key={i} id={`rsvp-acompanhante-${i + 1}`} type="text" label={`Nome completo do acompanhante ${i + 1}`} autoComplete="off" value={a.names[i] || ""} onChange={(e) => a.mudarNome(i, e.target.value)} required />
          ))}
        </fieldset>
      ) : null}
    </>
  );
}

export function EtapaDoConvite({ titulo, c, guest, coupleNames, dateLabel, locationName }: PropriedadesDaEtapa & PropriedadesDoCartao & { c: Confirmacao }) {
  const { acompanhantes: a, submitLoading } = c;
  return (
    <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
      <CartaoDoConvite titulo={titulo} guest={guest} coupleNames={coupleNames} dateLabel={dateLabel} locationName={locationName} />

      {guest.rsvpStatus !== "PENDING" ? (
        <p className="rounded-[12px] border border-linha bg-areia px-4 py-3 text-[15px] leading-6 text-tinta">
          Você já respondeu: {guest.rsvpStatus === "CONFIRMED" ? "vai ao casamento" : "não vai poder ir"}. Se mudou de ideia, é só responder de novo.
        </p>
      ) : null}

      {guest.allowedCompanions > 0 ? <EscolhaDeAcompanhantes guest={guest} a={a} /> : null}

      <Campo id="rsvp-restricoes" label="Restrição alimentar ou alergia" optional hint="Se não tiver nenhuma, é só deixar em branco.">
        {(campo) => <input {...campo} id="rsvp-restricoes" placeholder="Ex.: vegano, sem lactose" value={a.dietary} onChange={(e) => a.setDietary(e.target.value)} />}
      </Campo>

      {c.error ? <AvisoDoFormulario>{c.error}</AvisoDoFormulario> : null}

      <div className="flex flex-col gap-2">
        <Botao type="button" onClick={() => c.confirmar("CONFIRMED")} disabled={submitLoading !== null} loading={submitLoading === "CONFIRMED"} className="h-12 w-full rounded-[12px] px-6">
          Confirmar presença
        </Botao>
        <Botao type="button" variant="quiet" onClick={() => c.confirmar("DECLINED")} disabled={submitLoading !== null} loading={submitLoading === "DECLINED"} className="h-12 w-full rounded-[12px] px-6">
          Não poderei ir
        </Botao>
      </div>
    </section>
  );
}
