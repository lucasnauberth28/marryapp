import Link from "next/link";
import { ScrollText } from "lucide-react";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { GRUPOS_DE_ATIVIDADE, rotuloDoAlvo } from "@/lib/platform/activity";

export const FILTROS_DE_ATIVIDADES = [
  { key: "tipo", label: "Tipo", allLabel: "Todos", options: GRUPOS_DE_ATIVIDADE.map((g) => ({ value: g.value, label: g.label })) },
  { key: "periodo", label: "Período", allLabel: "Desde o começo", options: [{ value: "7d", label: "Últimos 7 dias" }, { value: "30d", label: "Últimos 30 dias" }, { value: "90d", label: "Últimos 90 dias" }] },
];

export function AvisoDoAlvo({ tipo, legenda }: { tipo: string; legenda: string | null | undefined }) {
  return (
    <p className="flex flex-wrap items-center gap-2 rounded-xl bg-ameixa-suave px-4 py-2.5 text-sm leading-5 text-tinta">
      <span>
        Mostrando só o que aconteceu com {rotuloDoAlvo(tipo)?.toLowerCase()}
        {legenda ? <strong className="font-semibold"> {legenda}</strong> : null}.
      </span>
      <Link href="/admin/atividades" className="font-semibold text-ameixa underline underline-offset-2">
        Ver tudo no registro
      </Link>
    </p>
  );
}

export function SemAtividades({ filtrado }: { filtrado: boolean }) {
  return filtrado ? (
    <EstadoVazio icon={ScrollText} compact title="Nada com esses filtros">
      Tente outro tipo ou período.
    </EstadoVazio>
  ) : (
    <EstadoVazio icon={ScrollText} compact title="Nada registrado ainda">
      As próximas ações da administração aparecem aqui.
    </EstadoVazio>
  );
}
