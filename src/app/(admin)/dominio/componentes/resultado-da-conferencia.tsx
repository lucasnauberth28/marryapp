import { AlertCircle, CheckCircle2, Clock, Info, XCircle } from "lucide-react";
import { Etiqueta, type TomDaEtiqueta } from "@/components/casal/ui";
import { Esqueleto } from "@/components/ui/skeleton";
import { TEXTO_DA_DISPONIBILIDADE, type DisponibilidadeDoDominio } from "@/lib/dominio/domain-availability";
import type { ConferenciaDeDominio } from "./tipos";

const TOM_DA_CONFERENCIA: Record<"sucesso" | "perigo" | "aviso" | "neutro", TomDaEtiqueta> = { sucesso: "sucesso", perigo: "perigo", aviso: "aviso", neutro: "neutro" };

const SITUACOES: Record<DisponibilidadeDoDominio, { Icone: typeof Info; rotulo: string }> = {
  available: { Icone: CheckCircle2, rotulo: "Livre" },
  taken: { Icone: XCircle, rotulo: "Já tem dono" },
  releasing: { Icone: Clock, rotulo: "Em liberação" },
  unknown: { Icone: Info, rotulo: "Sem resposta agora" },
};

export function ResultadoDaConferencia({ check }: { check: ConferenciaDeDominio }) {
  if (check.state === "idle") return null;
  if (check.state === "checking") {
    return (
      <div role="status" aria-busy="true" className="flex flex-col gap-2">
        <span className="sr-only">Conferindo se está livre…</span>
        <Esqueleto className="h-7 w-24 rounded-lg" />
        <Esqueleto className="h-5 w-72 max-w-full rounded-md" />
      </div>
    );
  }
  if (check.state === "invalid" || check.state === "error") {
    return (
      <p role="status" className="flex items-start gap-2 text-sm font-semibold text-perigo">
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {check.message}
      </p>
    );
  }
  const spec = TEXTO_DA_DISPONIBILIDADE[check.state];
  const { Icone, rotulo } = SITUACOES[check.state];
  return (
    <div role="status" className="flex flex-col gap-2">
      <Etiqueta tone={TOM_DA_CONFERENCIA[spec.tone]} icon={Icone}>
        {rotulo}
      </Etiqueta>
      <p className="text-sm leading-5 text-tinta">{spec.text(check.domain)}</p>
    </div>
  );
}
