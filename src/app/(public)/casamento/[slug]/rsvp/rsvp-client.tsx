"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, CalendarDays, Check, Download, Gift, MapPin, Phone } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { acharConvidadoPeloTelefone, confirmarPresencaPublica } from "@/actions/guest-actions";
import { estiloDoBotao } from "@/components/landing/styles";
import { Selo } from "@/components/landing/seal";
import { Button } from "@/components/ui/button";
import { Campo, AvisoDoFormulario } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { mascararTelefone } from "@/lib/formatacao/telefone";
import { caminhoDoSiteDoCasamento } from "@/lib/wedding-links";
import { lembrarConvidado } from "@/lib/use-saved-guest";
import { mensagemDaBusca, type ConvidadoDaConfirmacaoPublica } from "@/lib/rsvp-lookup";
import { cn } from "@/lib/utils";

interface RsvpClientProps {
  /** Casamento do endereço: a busca e a confirmação ficam restritas a ele */
  slug: string;
  coupleNames: string;
  dateLabel: string | null;
  locationName: string | null;
}

type Guest = ConvidadoDaConfirmacaoPublica;

const overline = "text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave";
const title = "font-display text-[34px] font-medium leading-10 tracking-[-0.015em] text-tinta outline-none";

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
      const result = await acharConvidadoPeloTelefone(slug, phone);
      if (result.status === "found") {
        const found = result.guest;
        setGuest(found);
        setCompanionsCount(0);
        setCompanionsNames(Array(found.allowedCompanions).fill(""));
        setDietary(found.dietaryRestrictions || "");
      } else {
        // Cada situação tem a sua mensagem: limite de tentativas não é "convite não encontrado"
        setError(mensagemDaBusca(result) ?? "");
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
      const res = await confirmarPresencaPublica(
        slug,
        guest.id,
        status,
        status === "CONFIRMED" ? companionsCount : 0,
        status === "CONFIRMED" ? activeNames : "",
        dietary,
      );
      if (res.success) {
        // Quem respondeu ao convite não precisa digitar nome e WhatsApp de novo se for dar um presente (só nesta aba).
        lembrarConvidado(slug, { name: guest.name, phone });
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
    <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col px-4 py-8 sm:py-14">
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
            <Campo id="rsvp-telefone" label="Seu WhatsApp com DDD" icon={Phone} error={error || undefined}>
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
                  onChange={(e) => setPhone(mascararTelefone(e.target.value))}
                  required
                />
              )}
            </Campo>
            <Button type="submit" loading={loading} className="h-12 w-full rounded-[12px] px-6">
              Encontrar meu convite
            </Button>
          </form>
          <p className="text-sm text-tinta-suave">Não achou o seu convite? Fale com os noivos, eles ajudam.</p>
        </section>
      ) : null}

      {stage === "convite" && guest ? (
        <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
          <div className="relative rounded-[16px] border border-linha bg-papel px-5 pb-6 pt-8 text-center shadow-[var(--shadow-aceito-2)]">
            <span aria-hidden="true" className="pointer-events-none absolute inset-2 rounded-[10px] border border-rosa" />
            <div className="relative">
              <p className={overline}>Seu convite chegou</p>
              <h1
                ref={headingRef}
                id="titulo"
                tabIndex={-1}
                className="mb-1 mt-2 font-display text-[36px] font-medium leading-[42px] tracking-[-0.015em] text-balance text-tinta outline-none"
              >
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
              {guest.allowedCompanions > 0 ? (
                <p className="mt-1 text-sm text-tinta-suave">
                  Isso inclui você e mais {guest.allowedCompanions === 1 ? "1 acompanhante" : `${guest.allowedCompanions} acompanhantes`}.
                </p>
              ) : null}
            </div>
          </div>

          {guest.rsvpStatus !== "PENDING" ? (
            <p className="rounded-[12px] border border-linha bg-areia px-4 py-3 text-[15px] leading-6 text-tinta">
              Você já respondeu: {guest.rsvpStatus === "CONFIRMED" ? "vai ao casamento" : "não vai poder ir"}. Se mudou de ideia, é só responder de novo.
            </p>
          ) : null}

          {guest.allowedCompanions > 0 ? (
            <>
              <NativeSelect
                id="rsvp-acompanhantes"
                label="Além de você, quantos acompanhantes?"
                value={companionsCount}
                onChange={(e) => setCompanionsCount(Number(e.target.value))}
              >
                {Array.from({ length: guest.allowedCompanions + 1 }).map((_, i) => (
                  <option key={i} value={i}>
                    {i === 0 ? "Nenhum acompanhante" : i === 1 ? "1 acompanhante" : `${i} acompanhantes`}
                  </option>
                ))}
              </NativeSelect>

              {companionsCount > 0 ? (
                <fieldset className="flex flex-col gap-5">
                  <legend className="mb-3 text-sm font-semibold leading-5 text-tinta">Nome de cada acompanhante</legend>
                  {Array.from({ length: companionsCount }).map((_, i) => (
                    <Input
                      key={i}
                      id={`rsvp-acompanhante-${i + 1}`}
                      type="text"
                      label={`Nome completo do acompanhante ${i + 1}`}
                      autoComplete="off"
                      value={companionsNames[i] || ""}
                      onChange={(e) => handleCompanionNameChange(i, e.target.value)}
                      required
                    />
                  ))}
                </fieldset>
              ) : null}
            </>
          ) : null}

          <Campo id="rsvp-restricoes" label="Restrição alimentar ou alergia" optional hint="Se não tiver nenhuma, é só deixar em branco.">
            {(c) => (
              <input
                {...c}
                id="rsvp-restricoes"
                placeholder="Ex.: vegano, sem lactose"
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
              />
            )}
          </Campo>

          {error ? <AvisoDoFormulario>{error}</AvisoDoFormulario> : null}

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              onClick={() => handleConfirm("CONFIRMED")}
              disabled={submitLoading !== null}
              loading={submitLoading === "CONFIRMED"}
              className="h-12 w-full rounded-[12px] px-6"
            >
              Confirmar presença
            </Button>
            <Button
              type="button"
              variant="quiet"
              onClick={() => handleConfirm("DECLINED")}
              disabled={submitLoading !== null}
              loading={submitLoading === "DECLINED"}
              className="h-12 w-full rounded-[12px] px-6"
            >
              Não poderei ir
            </Button>
          </div>
        </section>
      ) : null}

      {stage === "CONFIRMED" ? (
        <section aria-labelledby="titulo" className="step-in flex flex-col items-center gap-4 pt-4 text-center">
          <Selo label="Selo de confirmação" className="size-24 [&>span]:text-[54px]" />
          <h1 ref={headingRef} id="titulo" tabIndex={-1} className="mt-2 font-display text-[40px] font-medium leading-[46px] tracking-[-0.015em] text-tinta outline-none">
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
            <p className={overline}>Código QR para a entrada</p>
            <div ref={qrRef} className="rounded-[12px] border border-linha bg-papel p-4">
              <QRCodeCanvas value={`GUEST:${guest?.id ?? ""}`} size={168} level="H" />
            </div>
            <strong className="text-lg font-semibold">{guest?.name}</strong>
            <p className="text-sm text-tinta-suave">
              Este código QR serve para o registro de entrada na festa, se os noivos usarem esse recurso. Salve a imagem no celular, caso a internet falhe lá.
            </p>
            <button type="button" onClick={downloadQrCode} className={cn(estiloDoBotao.secondary, estiloDoBotao.block)}>
              <Download aria-hidden="true" className="size-4" />
              Salvar como imagem
            </button>
          </div>

          <div className="flex w-full flex-col rounded-[16px] border border-linha bg-papel px-6 py-4 text-left shadow-[var(--shadow-aceito-1)]">
            <p className={cn(overline, "mb-1")}>E agora?</p>
            <Link
              href={caminhoDoSiteDoCasamento(slug, "presentes")}
              className="flex min-h-12 items-center gap-3 font-semibold text-tinta no-underline"
            >
              <Gift aria-hidden="true" className="size-5 text-ameixa" strokeWidth={1.6} />
              <span className="flex-1">Ver os presentes em dinheiro</span>
              <ArrowRight aria-hidden="true" className="size-4 text-tinta-suave" />
            </Link>
          </div>

          <button type="button" onClick={() => setSuccessStatus(null)} className={cn(estiloDoBotao.quiet, "mt-2")}>
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
          <button type="button" onClick={() => setSuccessStatus(null)} className={cn(estiloDoBotao.secondary, "mt-4")}>
            Mudar minha resposta
          </button>
        </section>
      ) : null}
    </div>
  );
}
