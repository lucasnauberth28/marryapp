import type { obterVisaoGeralDaMadrinha } from "@/lib/platform/queries/madrinha";

type VisaoGeral = Awaited<ReturnType<typeof obterVisaoGeralDaMadrinha>>;

function situacaoDasInstrucoes({ suggestedOnly, latestInstruction }: VisaoGeral) {
  if (suggestedOnly) return { done: false, text: "Só o texto sugerido" };
  if (!latestInstruction) return { done: false, text: "Pendente" };
  if (latestInstruction.status === "PUBLISHED") return { done: true, text: `Versão ${latestInstruction.version} publicada` };
  return { done: false, text: `Rascunho ${latestInstruction.version} salvo` };
}

/** O que falta para ativar a Liz, na ordem em que a equipe faz. */
export function checklistDaLiz(overview: VisaoGeral) {
  const instructionStatus = situacaoDasInstrucoes(overview);
  const tetoSalvo = overview.meta["madrinha.globalCap"].saved;
  return [
    { label: "Conectar a chave da API", done: false, text: "Pendente" },
    { label: "Escrever as instruções", done: instructionStatus.done, text: instructionStatus.text },
    { label: "Definir tetos de custo", done: tetoSalvo, text: tetoSalvo ? "Feito" : "Pendente" },
    { label: "Testar com a equipe", done: false, text: "Pendente" },
  ];
}
