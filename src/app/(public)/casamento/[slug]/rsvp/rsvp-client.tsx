"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, CalendarDays, Check, Download, Gift, Loader2, MapPin, Phone } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { findGuestByPhone, publicConfirmRsvp } from "@/actions/guest-actions";
import { btn } from "@/components/landing/styles";
import { Seal } from "@/components/landing/seal";
import { Field, FormAlert, maskPhone } from "@/app/login/fields";
import { weddingSitePath } from "@/lib/wedding-links";
import { cn } from "@/lib/utils";

interface RsvpClientProps {
  /** Casamento do endereço: a busca e a confirmação ficam restritas a ele */
  slug: string;
  coupleNames: string;
  dateLabel: string | null;
  locationName: string | null;
}

type Guest = NonNullable<Awaited<ReturnType<typeof findGuestByPhone>>>;

const overline = "text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave";
const title = "font-display text-[34px] font-normal leading-10 tracking-[-0.015em] text-tinta outline-none";
const selectClass =
  "block min-h-12 w-full cursor-pointer rounded-[12px] border border-linha-forte bg-papel px-4 text-base leading-6 text-tinta transition-[border-color,box-shadow] duration-200 hover:border-tinta-suave focus:border-ameixa focus:shadow-[0_0_0_3px_var(--color-ameixa-suave)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ameixa";

export function RsvpClient({ slug, coupleNames, dateLabel, locationName }: RsvpClientProps) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [guest, setGuest] = useState<Guest | null>(null);

  const [companionsCount, setCompanionsCount] = useState(0);
  const [companionsNames, setCompanionsNames] = useState<string[]>([]);
  const [dietary, setDietary] = useState("");
  const [submitLoading, setSubmitLoading] = useState<"CONFIRMED" | "DECLINED" | null>(null);
  const [successStatus, setSuccessStatus] = useState<"CONFIRMED" | "DECLINED" | null>(null);

  const qrRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const stage = successStatus ?? (guest ? "convite" : "busca");
  // Ao trocar de etapa o foco vai para o título: quem usa leitor de tela ouve a nova etapa.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stage]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setGuest(null);
    setLoading(true);

    try {
      const found = await findGuestByPhone(slug, phone);
      if (found) {
        setGuest(found);
        setCompanionsCount(0);
        setCompanionsNames(Array(found.allowedCompanions).fill(""));
        setDietary(found.dietaryRestrictions || "");
      } else {
        setError("Não achamos um convite com este número. Use o WhatsApp com DDD que os noivos têm de você. Se ainda não achar, fale com eles.");
      }
    } catch {
      setError("Não conseguimos buscar o convite agora. Tente de novo em instantes.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompanionNameChange = (index: number, val: string) => {
    const updated = [...companionsNames];
    updated[index] = val;
    setCompanionsNames(updated);
  };

  const handleConfirm = async (status: "CONFIRMED" | "DECLINED") => {
    if (!guest) return;
    setSubmitLoading(status);
    setError("");

    // Une os nomes preenchidos dos acompanhantes ativos
    const activeNames = companionsNames
      .slice(0, companionsCount)
      .filter((n) => n.trim() !== "")
      .join(", ");

    try {
      const res = await publicConfirmRsvp(
        slug,
        guest.id,
        status,
        status === "CONFIRMED" ? companionsCount : 0,
        status === "CONFIRMED" ? activeNames : "",
        dietary,
      );
      if (res.success) {
        setSuccessStatus(status);
      } else {
        setError(res.error || "Não conseguimos salvar a sua resposta. Tente de novo.");
      }
    } catch {
      setError("Sem conexão com o servidor. Confira a internet e tente de novo.");
    } finally {
      setSubmitLoading(null);
    }
  };

  const downloadQrCode = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `ingresso-${guest?.name.replace(/\s+/g, "-").toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("O ingresso foi salvo no seu aparelho.");
  };

  const firstName = guest?.name.trim().split(/\s+/)[0] ?? "";
  const seats = guest ? guest.allowedCompanions + 1 : 1;
  const confirmedPeople = companionsCount + 1;

  return (
    <main id="conteudo" className="mx-auto flex w-full max-w-[460px] flex-1 flex-col px-4 py-8 sm:py-14">
      {stage === "busca" ? (
        <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className={overline}>Confirmação de presença</p>
            <h1 ref={headingRef} id="titulo" tabIndex={-1} className={title}>
              Vamos achar o seu convite
            </h1>
            <p className="text-tinta-suave">Digite o seu WhatsApp com DDD, o mesmo que os noivos têm de você. Você verá só o seu convite.</p>
          </div>
          <form onSubmit={handleSearch} className="flex flex-col gap-6">
            <Field id="rsvp-telefone" label="Seu WhatsApp com DDD" icon={Phone} error={error || undefined}>
              {(c) => (
                <input
                  {...c}
                  id="rsvp-telefone"
                  type="tel"
                  name="phone"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  required
                />
              )}
            </Field>
            <button type="submit" disabled={loading} className={cn(btn.primary, btn.block, "min-h-12")}>
              {loading ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
              {loading ? "Procurando…" : "Encontrar meu convite"}
            </button>
          </form>
          <p className="text-sm text-tinta-suave">Não achou o seu convite? Fale com os noivos, eles ajudam.</p>
        </section>
      ) : null}

      {stage === "convite" && guest ? (
        <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
          <div className="relative rounded-[16px] border border-linha bg-papel px-5 pb-6 pt-8 text-center shadow-[var(--shadow-aceito-2)]">
            <span aria-hidden="true" className="pointer-events-none absolute inset-2 rounded-[10px] border border-champanhe" />
            <div className="relative">
              <p className={overline}>Seu convite chegou</p>
              <h1
                ref={headingRef}
                id="titulo"
                tabIndex={-1}
                className="mb-1 mt-2 font-display text-[36px] font-normal leading-[42px] tracking-[-0.015em] text-balance text-tinta outline-none"
              >
                {coupleNames}
              </h1>
              {dateLabel || locationName ? (
                <div className="mt-4 flex flex-col gap-1 text-sm leading-5 text-tinta-suave">
                  {dateLabel ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <CalendarDays aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
                      {dateLabel}
                    </span>
                  ) : null}
                  {locationName ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <MapPin aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
                      {locationName}
                    </span>
                  ) : null}
                </div>
              ) : null}
              <p className="mt-6">
                {firstName}, guardamos <strong className="font-semibold">{seats === 1 ? "1 lugar" : `${seats} lugares`}</strong> para você.
              </p>
            </div>
          </div>

          {guest.rsvpStatus !== "PENDING" ? (
            <p className="rounded-[12px] border border-linha bg-areia px-4 py-3 text-[15px] leading-6 text-tinta">
              Você já respondeu: {guest.rsvpStatus === "CONFIRMED" ? "vai ao casamento" : "não vai poder ir"}. Se mudou de ideia, é só responder de novo.
            </p>
          ) : null}

          {guest.allowedCompanions > 0 ? (
            <>
              <div className="flex flex-col gap-2">
                <label htmlFor="rsvp-acompanhantes" className="text-sm font-semibold leading-5 text-tinta">
                  Quantos acompanhantes você vai levar?
                </label>
                <select
                  id="rsvp-acompanhantes"
                  value={companionsCount}
                  onChange={(e) => setCompanionsCount(Number(e.target.value))}
                  className={selectClass}
                >
                  {Array.from({ length: guest.allowedCompanions + 1 }).map((_, i) => (
                    <option key={i} value={i}>
                      {i === 0 ? "Nenhum acompanhante" : i === 1 ? "1 acompanhante" : `${i} acompanhantes`}
                    </option>
                  ))}
                </select>
              </div>

              {companionsCount > 0 ? (
                <fieldset className="flex flex-col gap-3">
                  <legend className="mb-2 text-sm font-semibold leading-5 text-tinta">Nome de cada acompanhante</legend>
                  {Array.from({ length: companionsCount }).map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      aria-label={`Nome completo do acompanhante ${i + 1}`}
                      autoComplete="off"
                      placeholder={`Nome completo do acompanhante ${i + 1}`}
                      value={companionsNames[i] || ""}
                      onChange={(e) => handleCompanionNameChange(i, e.target.value)}
                      className="block min-h-12 w-full rounded-[12px] border border-linha-forte bg-papel px-4 text-base leading-6 text-tinta placeholder:text-tinta-suave/80 hover:border-tinta-suave focus:border-ameixa focus:shadow-[0_0_0_3px_var(--color-ameixa-suave)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ameixa"
                      required
                    />
                  ))}
                </fieldset>
              ) : null}
            </>
          ) : null}

          <Field id="rsvp-restricoes" label="Alguma restrição alimentar ou alergia?" optional hint="Se não tiver nenhuma, é só deixar em branco.">
            {(c) => (
              <input
                {...c}
                id="rsvp-restricoes"
                placeholder="Ex.: vegano, sem lactose"
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
              />
            )}
          </Field>

          {error ? <FormAlert>{error}</FormAlert> : null}

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleConfirm("CONFIRMED")}
              disabled={submitLoading !== null}
              className={cn(btn.primary, btn.block, "min-h-12")}
            >
              {submitLoading === "CONFIRMED" ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
              Aceito o convite
            </button>
            <button
              type="button"
              onClick={() => handleConfirm("DECLINED")}
              disabled={submitLoading !== null}
              className={cn(btn.quiet, btn.block, "min-h-12")}
            >
              {submitLoading === "DECLINED" ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
              Não vou poder ir
            </button>
          </div>
        </section>
      ) : null}

      {stage === "CONFIRMED" ? (
        <section aria-labelledby="titulo" className="step-in flex flex-col items-center gap-4 pt-4 text-center">
          <Seal label="Selo de confirmação" className="size-24 [&>span]:text-[54px]" />
          <h1 ref={headingRef} id="titulo" tabIndex={-1} className="mt-2 font-display text-[40px] font-normal leading-[46px] tracking-[-0.015em] text-tinta outline-none">
            Que alegria!
          </h1>
          <p className="max-w-[32ch] text-tinta-suave">
            {companionsCount === 0
              ? "A sua presença está confirmada. Mal podemos esperar para viver esse momento com você."
              : `A sua presença e a de ${companionsCount === 1 ? "1 acompanhante" : `${companionsCount} acompanhantes`} estão confirmadas.`}
          </p>
          <span className="inline-flex min-h-7 items-center gap-1 rounded-[6px] bg-sucesso-suave px-3 text-sm font-semibold text-sucesso">
            <Check aria-hidden="true" className="size-4" strokeWidth={2.25} />
            {confirmedPeople === 1 ? "1 confirmado" : `${confirmedPeople} confirmados`}
          </span>

          <div className="mt-2 flex w-full flex-col items-center gap-4 rounded-[16px] border border-linha bg-papel p-6 shadow-[var(--shadow-aceito-1)]">
            <p className={overline}>Seu ingresso</p>
            <div ref={qrRef} className="rounded-[12px] border border-linha bg-papel p-4">
              <QRCodeCanvas value={`GUEST:${guest?.id ?? ""}`} size={168} level="H" />
            </div>
            <strong className="text-lg font-semibold">{guest?.name}</strong>
            <p className="text-sm text-tinta-suave">
              Mostre este QR Code na entrada para entrar mais rápido. Salve a imagem no celular, caso a internet falhe lá.
            </p>
            <button type="button" onClick={downloadQrCode} className={cn(btn.secondary, btn.block)}>
              <Download aria-hidden="true" className="size-4" />
              Salvar o ingresso como imagem
            </button>
          </div>

          <div className="flex w-full flex-col rounded-[16px] border border-linha bg-papel px-6 py-4 text-left shadow-[var(--shadow-aceito-1)]">
            <p className={cn(overline, "mb-1")}>E agora?</p>
            <Link
              href={weddingSitePath(slug, "presentes")}
              className="flex min-h-12 items-center gap-3 font-semibold text-tinta no-underline"
            >
              <Gift aria-hidden="true" className="size-5 text-ameixa" strokeWidth={1.75} />
              <span className="flex-1">Ver a lista de presentes</span>
              <ArrowRight aria-hidden="true" className="size-4 text-tinta-suave" />
            </Link>
          </div>

          <button type="button" onClick={() => setSuccessStatus(null)} className={cn(btn.quiet, "mt-2")}>
            Mudar minha resposta
          </button>
        </section>
      ) : null}

      {stage === "DECLINED" ? (
        <section aria-labelledby="titulo" className="step-in flex flex-col items-center gap-4 pt-8 text-center">
          <h1 ref={headingRef} id="titulo" tabIndex={-1} className={cn(title, "text-balance")}>
            Que pena, vamos sentir sua falta
          </h1>
          <p className="max-w-[34ch] text-tinta-suave">
            Avisamos {coupleNames}. Se os planos mudarem, é só voltar aqui e responder de novo.
          </p>
          <button type="button" onClick={() => setSuccessStatus(null)} className={cn(btn.secondary, "mt-4")}>
            Mudar minha resposta
          </button>
        </section>
      ) : null}
    </main>
  );
}
