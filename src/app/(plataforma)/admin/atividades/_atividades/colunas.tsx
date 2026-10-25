import Link from "next/link";
import { formatarDataEHora } from "@/lib/platform/format";
import { rotuloDaAcao, resumirDetalhes, linkDoAlvo, rotuloDoAlvo } from "@/lib/platform/activity";
import type { listarAtividades } from "@/lib/platform/queries/atividades";

type LinhaDeAtividade = Awaited<ReturnType<typeof listarAtividades>>["rows"][number];

function CelulaDoQueFez({ r }: { r: LinhaDeAtividade }) {
  const href = linkDoAlvo(r.targetType, r.targetId);
  const label = rotuloDoAlvo(r.targetType);
  return (
    <span className="flex flex-col">
      <span className="font-semibold text-tinta">{rotuloDaAcao(r.action)}</span>
      {label && (href ? <Link href={href} className="relative text-[13px] text-ameixa underline underline-offset-2">{label}</Link> : <span className="text-[13px] text-tinta-suave">{label}</span>)}
    </span>
  );
}

export const COLUNAS_DE_ATIVIDADES = [
  { key: "when", header: "Quando", mobileLabel: false as const, cell: (r: LinhaDeAtividade) => <span className="whitespace-nowrap text-sm text-tinta-suave">{formatarDataEHora(r.createdAt)}</span> },
  { key: "who", header: "Quem", mobileLabel: "Quem", cell: (r: LinhaDeAtividade) => r.actorName ?? "Sem login" },
  { key: "what", header: "O que fez", primary: true, cell: (r: LinhaDeAtividade) => <CelulaDoQueFez r={r} /> },
  { key: "details", header: "Detalhes", mobileLabel: false as const, cell: (r: LinhaDeAtividade) => <span className="break-words text-sm text-tinta-suave">{resumirDetalhes(r.details, r.action, r.targetId) || "Sem detalhes"}</span> },
];
