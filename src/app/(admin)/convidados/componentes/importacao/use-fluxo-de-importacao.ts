// O passo a passo da importação: escolher o arquivo, conferir a prévia, importar e ver o resultado.
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { toast } from "sonner";
import { planejarImportacao, type ConvidadoExistente } from "@/lib/importacao-de-convidados/repetidos";
import { pluralizar } from "@/lib/formatacao/plural";
import type { EtapaDoFluxo, PlanilhaLida, ResultadoDaImportacao } from "./tipos";
import { enviarPlanoDaImportacao, lerArquivoDaPlanilha } from "./utilitarios";

/** A cada etapa nova, o foco vai para o título dela: quem usa leitor de tela ouve onde está. */
function useFocoNoTituloDaEtapa(stage: EtapaDoFluxo, titulo: RefObject<HTMLHeadingElement | null>) {
  useEffect(() => {
    if (stage !== "escolher") titulo.current?.focus();
  }, [stage, titulo]);
}

export function useFluxoDeImportacao(existing: ConvidadoExistente[], stageHeading: RefObject<HTMLHeadingElement | null>) {
  const [stage, setStage] = useState<EtapaDoFluxo>("escolher");
  const [sheet, setSheet] = useState<PlanilhaLida | null>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultadoDaImportacao | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const plan = useMemo(() => (sheet ? planejarImportacao(sheet.rows, existing) : null), [sheet, existing]);

  useFocoNoTituloDaEtapa(stage, stageHeading);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setReading(true);
    const leitura = await lerArquivoDaPlanilha(file);
    setReading(false);
    if (fileInput.current) fileInput.current.value = ""; // permite escolher o mesmo arquivo de novo
    if (!leitura.ok) return setError(leitura.error);
    setSheet(leitura.planilha);
    setStage("previa");
  }

  const falhar = (message: string, toastId: string | number) => {
    setError(message);
    setStage("previa");
    toast.error(message, { id: toastId, duration: 6000 });
  };

  async function runImport() {
    if (!plan || plan.toAdd.length === 0) return;
    setError(null);
    setStage("importando");
    const toastId = toast.loading("Importando a lista...");
    const res = await enviarPlanoDaImportacao(plan);
    if (!res.ok) return falhar(res.error, toastId);
    // Repetidos: os que a prévia já tirou mais os que o servidor achou na hora de gravar
    setResult({ added: res.added, duplicates: plan.duplicates.length + res.duplicates, invalid: plan.invalid.length });
    setStage("pronto");
    toast.success(`${pluralizar(res.added, "convidado adicionado", "convidados adicionados")}.`, { id: toastId });
  }

  const escolherOutro = () => {
    setSheet(null);
    setError(null);
    setStage("escolher");
  };
  return { stage, sheet, plan, reading, error, result, fileInput, handleFile, runImport, escolherOutro };
}

export type FluxoDeImportacao = ReturnType<typeof useFluxoDeImportacao>;
