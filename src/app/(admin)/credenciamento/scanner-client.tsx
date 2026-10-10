"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { Camera, Check, Clock, Search, QrCode, TriangleAlert, X } from "lucide-react";
import { checkInGuest } from "@/actions/guest-actions";
import { PageHeader } from "@/components/admin/page-header";
import { Seal } from "@/components/painel/seal";
import { StatusChip } from "@/components/painel/status-chip";
import { btn, card, errorBox, input, overline } from "@/components/painel/styles";
import { lookupGuestForCheckIn, searchGuestsForCheckIn, type CheckInGuestInfo } from "./lookup-actions";

type Stage = "idle" | "scanning" | "loading" | "found";

export function ScannerClient({ initialArrived, confirmed }: { initialArrived: number; confirmed: number }) {
  const [stage, setStage] = useState<Stage>("idle");
  const [arrived, setArrived] = useState(initialArrived);
  const [found, setFound] = useState<CheckInGuestInfo | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirming, setConfirming] = useState(false);

  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<CheckInGuestInfo[] | null>(null);
  const searchId = useId();
  const searchSeq = useRef(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  // Desliga a câmera ao sair da tela
  useEffect(() => {
    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, []);

  const startScanning = async () => {
    setStage("scanning");
    setMessage(null);
    setFound(null);
    try {
      if (typeof window !== "undefined" && navigator?.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
          });
          stream.getTracks().forEach((track) => track.stop());
        } catch (permErr) {
          console.warn("Media devices permission request:", permErr);
        }
      }
      // Espera o vídeo entrar na tela antes de ligar o leitor
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const codeReader = new BrowserQRCodeReader();
      const constraints: MediaStreamConstraints = {
        video: { facingMode: { ideal: "environment" } },
      };

      const controls = await codeReader.decodeFromConstraints(constraints, videoRef.current!, async (res, _error, ctrl) => {
        if (res) {
          ctrl.stop();
          controlsRef.current = null;
          void handleScannedCode(res.getText());
        }
      });

      controlsRef.current = controls;
    } catch (err) {
      console.error(err);
      setMessage({ ok: false, text: "Não deu para abrir a câmera. Libere o acesso à câmera no navegador ou busque pelo nome." });
      setStage("idle");
    }
  };

  const stopScanning = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setStage("idle");
  };

  const handleScannedCode = async (text: string) => {
    if (!text.startsWith("GUEST:")) {
      setMessage({ ok: false, text: "Esse QR Code não é de um convite do Aceito." });
      setStage("idle");
      return;
    }
    setStage("loading");
    try {
      const res = await lookupGuestForCheckIn(text.replace("GUEST:", ""));
      if (res.success) {
        setFound(res.guest);
        setStage("found");
      } else {
        setMessage({ ok: false, text: res.error });
        setStage("idle");
      }
    } catch {
      setMessage({ ok: false, text: "Não deu para conferir o convite. Verifique a internet e tente de novo." });
      setStage("idle");
    }
  };

  const runSearch = async (value: string) => {
    setQuery(value);
    const seq = ++searchSeq.current;
    if (value.trim().length < 2) {
      setMatches(null);
      return;
    }
    const list = await searchGuestsForCheckIn(value);
    // Ignora respostas antigas se a pessoa já digitou mais
    if (seq === searchSeq.current) setMatches(list);
  };

  const pickGuest = (g: CheckInGuestInfo) => {
    setFound(g);
    setMessage(null);
    setQuery("");
    setMatches(null);
    setStage("found");
  };

  const confirmEntry = async () => {
    if (!found) return;
    setConfirming(true);
    try {
      const res = await checkInGuest(found.id);
      if (res.success) {
        setArrived((n) => n + 1);
        setMessage({ ok: true, text: `Entrada liberada: ${res.guestName}.` });
      } else {
        setMessage({ ok: false, text: res.error || "Não deu para registrar a entrada." });
      }
    } catch {
      setMessage({ ok: false, text: "Não deu para registrar a entrada. Verifique a internet e tente de novo." });
    }
    setConfirming(false);
    setFound(null);
    setStage("idle");
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Convidados"
        title="Check-in no dia"
        description="Aponte a câmera para o QR Code do convite e libere a entrada de cada convidado."
        actions={
          <StatusChip tone="sucesso" icon={<Check className="size-4" aria-hidden="true" />}>
            {arrived} de {confirmed} {confirmed === 1 ? "confirmado chegou" : "confirmados chegaram"}
          </StatusChip>
        }
      />

      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        {message && (
          <p role={message.ok ? "status" : "alert"} className={message.ok ? "flex items-start gap-2 rounded-xl bg-sucesso-suave px-4 py-3 font-semibold text-sucesso" : errorBox}>
            {message.ok ? <Check className="mt-0.5 size-5 shrink-0" aria-hidden="true" /> : <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />}
            {message.text}
          </p>
        )}

        {stage === "loading" && (
          <div role="status" className={`${card} flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-tinta-suave`}>
            <span className="size-8 animate-spin rounded-full border-2 border-linha border-t-ameixa" aria-hidden="true" />
            Conferindo o convite...
          </div>
        )}

        {stage === "scanning" && (
          <div className="flex flex-col overflow-hidden rounded-2xl bg-[#1b1620]">
            <div className="relative flex min-h-80 items-center justify-center">
              <video ref={videoRef} className="absolute inset-0 size-full object-cover" playsInline autoPlay muted aria-label="Câmera para ler o QR Code" />
              <div aria-hidden="true" className="relative size-56 rounded-3xl border-[3px] border-papel shadow-[0_0_0_999px_rgba(27,22,32,0.45)]">
                <div className="absolute inset-x-4 top-1/2 h-0.5 bg-petala" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 px-4 py-5">
              <p className="text-base text-papel">Aponte para o QR Code do convidado</p>
              <button type="button" onClick={stopScanning} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-papel px-4 font-semibold text-papel hover:bg-white/10">
                <X className="size-4" aria-hidden="true" />
                Cancelar leitura
              </button>
            </div>
          </div>
        )}

        {stage === "found" && found && (
          <section className={`${card} flex flex-col items-center gap-4 p-6 text-center`} aria-label="Convite lido">
            <Seal label={found.alreadyIn ? "Convite já usado" : "Convite válido"} />
            {found.alreadyIn ? (
              <StatusChip tone="aviso" icon={<Clock className="size-4" aria-hidden="true" />}>
                Já fez o check-in
              </StatusChip>
            ) : (
              <StatusChip tone="sucesso" icon={<Check className="size-4" aria-hidden="true" />}>
                Convite válido
              </StatusChip>
            )}
            <h2 className="font-display text-[34px] font-normal leading-10 text-tinta">{found.name}</h2>
            <dl className="grid w-full grid-cols-2 gap-3 rounded-2xl border border-linha p-4 text-left">
              <div>
                <dt className={overline}>Pessoas</dt>
                <dd className="mt-1 font-display text-[28px] leading-8 text-tinta">{found.people}</dd>
              </div>
              <div>
                <dt className={overline}>Mesa</dt>
                <dd className={`mt-1 font-display text-[28px] leading-8 ${found.table ? "text-ameixa" : "text-tinta-suave"}`}>{found.table ?? "Sem mesa"}</dd>
              </div>
              {found.note && (
                <div className="col-span-2">
                  <dt className={overline}>Observação</dt>
                  <dd className="mt-1 text-tinta">{found.note}</dd>
                </div>
              )}
            </dl>
            <div className="flex w-full flex-col gap-2">
              {!found.alreadyIn && (
                <button type="button" onClick={confirmEntry} disabled={confirming} className={`${btn.primary} ${btn.block}`}>
                  {confirming ? "Registrando..." : `Confirmar entrada de ${found.people}`}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setFound(null);
                  setStage("idle");
                }}
                disabled={confirming}
                className={`${btn.quiet} ${btn.block}`}
              >
                {found.alreadyIn ? "Voltar" : "Cancelar"}
              </button>
            </div>
          </section>
        )}

        {stage === "idle" && (
          <>
            <section className={`${card} flex flex-col items-center gap-4 p-8 text-center`}>
              <span className="grid size-20 place-items-center rounded-full bg-ameixa-suave text-ameixa">
                <Camera className="size-9" aria-hidden="true" />
              </span>
              <h2 className="font-display text-[26px] font-medium leading-8 text-tinta">Pronto para ler</h2>
              <p className="text-tinta-suave">Peça o QR Code do convite e aproxime da câmera.</p>
              <button type="button" onClick={startScanning} className={`${btn.primary} ${btn.block} sm:w-auto`}>
                <QrCode className="size-5" aria-hidden="true" />
                Ler QR Code do convidado
              </button>
            </section>

            <section className={`${card} flex flex-col gap-3 p-4`}>
              <label htmlFor={searchId} className="text-sm font-semibold text-tinta">
                Sem QR? Buscar pelo nome
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-tinta-suave" aria-hidden="true" />
                <input id={searchId} type="search" autoComplete="off" value={query} onChange={(e) => void runSearch(e.target.value)} placeholder="Digite o nome do convidado" className={`${input} pl-10`} />
              </div>
              {matches && (
                <ul className="flex flex-col divide-y divide-linha rounded-xl border border-linha">
                  {matches.length === 0 && <li className="px-4 py-4 text-sm text-tinta-suave">Ninguém com esse nome na lista.</li>}
                  {matches.map((g) => (
                    <li key={g.id}>
                      <button type="button" onClick={() => pickGuest(g)} className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 px-4 py-2 text-left hover:bg-ameixa-suave/40">
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-tinta">{g.name}</span>
                          <span className="block text-sm text-tinta-suave">
                            {g.people} {g.people === 1 ? "pessoa" : "pessoas"} · {g.table ?? "sem mesa"}
                          </span>
                        </span>
                        {g.alreadyIn && <StatusChip tone="aviso">Já entrou</StatusChip>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
