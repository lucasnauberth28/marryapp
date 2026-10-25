"use client";
// Registro de entrada na festa: lê o código QR do convite (ou busca pelo nome) e registra a chegada.
import { useRef } from "react";
import { Check, TriangleAlert } from "lucide-react";
import { CabecalhoDaPagina } from "@/components/admin/page-header";
import { EtiquetaDeSituacao } from "@/components/painel/status-chip";
import { estiloDaCaixaDeErro } from "@/components/painel/styles";
import { CameraDeLeitura } from "./componentes/camera-de-leitura";
import { ConviteEmConferencia } from "./componentes/convite-em-conferencia";
import { ConviteLido } from "./componentes/convite-lido";
import { ProntoParaLer } from "./componentes/pronto-para-ler";
import type { MensagemDaEntrada } from "./componentes/tipos";
import { useBuscaPorNome } from "./componentes/use-busca-por-nome";
import { useFluxoDaEntrada } from "./componentes/use-fluxo-da-entrada";
import { useLeitorDeQr } from "./componentes/use-leitor-de-qr";

function AvisoDaEntrada({ message }: { message: MensagemDaEntrada }) {
  return (
    <p role={message.ok ? "status" : "alert"} className={message.ok ? "flex items-start gap-2 rounded-xl bg-sucesso-suave px-4 py-3 font-semibold text-sucesso" : estiloDaCaixaDeErro}>
      {message.ok ? <Check className="mt-0.5 size-5 shrink-0" aria-hidden="true" /> : <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />}
      {message.text}
    </p>
  );
}

export function LeitorCliente({ initialArrived, confirmed }: { initialArrived: number; confirmed: number }) {
  const video = useRef<HTMLVideoElement>(null);
  const fluxo = useFluxoDaEntrada(initialArrived);
  const busca = useBuscaPorNome();
  const leitor = useLeitorDeQr(video, (texto) => void fluxo.aoLerCodigo(texto), (texto) => fluxo.voltar({ ok: false, text: texto }));
  const { stage, found } = fluxo;

  const comecarLeitura = () => {
    fluxo.setMessage(null);
    fluxo.setStage("scanning");
    void leitor.iniciar();
  };
  const cancelarLeitura = () => {
    leitor.parar();
    fluxo.setStage("idle");
  };
  const escolher = (convidado: Parameters<typeof fluxo.mostrarConvidado>[0]) => {
    busca.limpar();
    fluxo.mostrarConvidado(convidado);
  };

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoDaPagina
        eyebrow="Convidados"
        title="Registro de entrada dos convidados"
        description="Quem confirma presença pelo link recebe um código QR para a entrada na festa. Aponte a câmera para o código e registre a chegada de cada convidado."
        actions={
          <EtiquetaDeSituacao tone="sucesso" icon={<Check className="size-4" aria-hidden="true" />}>
            {fluxo.arrived} de {confirmed} {confirmed === 1 ? "confirmado chegou" : "confirmados chegaram"}
          </EtiquetaDeSituacao>
        }
      />
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        {fluxo.message && <AvisoDaEntrada message={fluxo.message} />}
        {stage === "loading" && <ConviteEmConferencia />}
        {stage === "scanning" && <CameraDeLeitura video={video} pronta={leitor.cameraReady} aoTocar={() => leitor.setCameraReady(true)} aoCancelar={cancelarLeitura} />}
        {stage === "found" && found && <ConviteLido found={found} confirming={fluxo.confirming} aoConfirmar={fluxo.confirmarEntrada} aoVoltar={() => fluxo.voltar(null)} />}
        {stage === "idle" && <ProntoParaLer busca={busca} aoLer={comecarLeitura} aoEscolher={escolher} />}
      </div>
    </div>
  );
}
