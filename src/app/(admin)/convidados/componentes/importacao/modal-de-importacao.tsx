import { useRef } from "react";
import { ModalPersonalizado } from "@/components/ui/custom-modal";
import type { ConvidadoExistente } from "@/lib/importacao-de-convidados/repetidos";
import { EtapaEscolher } from "./etapa-escolher";
import { EtapaImportando } from "./etapa-importando";
import { EtapaPrevia } from "./etapa-previa";
import { EtapaPronto } from "./etapa-pronto";
import { useFluxoDeImportacao } from "./use-fluxo-de-importacao";

interface PropriedadesDoModalDeImportacao {
  isOpen: boolean;
  onClose: () => void;
  /** Quem já está na lista: telefone igual a um deles é pulado. */
  existing: ConvidadoExistente[];
}

function FluxoDeImportacao({ existing, onClose }: { existing: ConvidadoExistente[]; onClose: () => void }) {
  const titulo = useRef<HTMLHeadingElement>(null);
  const fluxo = useFluxoDeImportacao(existing, titulo);
  if (fluxo.stage === "escolher") return <EtapaEscolher fluxo={fluxo} />;
  if (fluxo.stage === "importando") return <EtapaImportando titulo={titulo} />;
  if (fluxo.stage === "pronto" && fluxo.result) return <EtapaPronto result={fluxo.result} titulo={titulo} aoFechar={onClose} />;
  if (!fluxo.sheet || !fluxo.plan) return null;
  return <EtapaPrevia fluxo={fluxo} titulo={titulo} sheet={fluxo.sheet} plan={fluxo.plan} />;
}

export function ModalDeImportacaoDeConvidados({ isOpen, onClose, existing }: PropriedadesDoModalDeImportacao) {
  return (
    <ModalPersonalizado
      isOpen={isOpen}
      onClose={onClose}
      title="Importar lista de convidados"
      description="Tragam uma planilha que vocês já têm. Antes de adicionar, mostramos o que vai entrar."
      size="lg"
      className="max-h-[92vh] overflow-y-auto"
    >
      {/* Remonta ao reabrir: começa sempre do zero */}
      {isOpen ? <FluxoDeImportacao existing={existing} onClose={onClose} /> : null}
    </ModalPersonalizado>
  );
}
