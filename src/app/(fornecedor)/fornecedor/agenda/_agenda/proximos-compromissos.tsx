import Link from "next/link";
import { cn } from "@/lib/utils";
import { EtiquetaBase } from "../../../_components/status-chip";
import { DIAS_DA_SEMANA_CURTOS, MESES, formatarHoraDoPainel, paraDataIso } from "../../../_lib/datas-do-painel";
import { BotaoDeExcluirEvento } from "./botao-de-excluir-evento";
import type { Proximo } from "./dados";

const ESTILO_DO_CARTAO = "rounded-2xl border border-linha bg-papel shadow-[var(--shadow-aceito-1)]";
const UM_DIA_EM_MS = 86_400_000;
const LINK_DO_PEDIDO = "inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-ameixa hover:bg-areia";

/** "Hoje", "Amanhã" ou "Qua, 15 out" (datas à meia-noite UTC). */
function rotuloDoDia(date: Date, today: Date) {
  const diff = Math.round((date.getTime() - today.getTime()) / UM_DIA_EM_MS);
  if (diff === 0) return "Hoje";
  if (diff === 1) return `Amanhã · ${DIAS_DA_SEMANA_CURTOS[date.getUTCDay()]}`;
  const sameYear = date.getUTCFullYear() === today.getUTCFullYear();
  return `${DIAS_DA_SEMANA_CURTOS[date.getUTCDay()]}, ${date.getUTCDate()} ${MESES[date.getUTCMonth()]}${sameYear ? "" : ` ${date.getUTCFullYear()}`}`;
}

function CompromissoDeEvento({ item }: { item: Exclude<Proximo, { type: "WEDDING" }> }) {
  return (
    <>
      <strong className="text-[17px] font-semibold break-words">{item.type === "BLOCKED" ? "Data bloqueada" : item.title}</strong>
      {item.type === "BLOCKED" && item.title !== "Data bloqueada" ? <span className="text-sm text-tinta-suave">{item.title}</span> : null}
      {item.type === "MEETING" && item.notes ? <span className="text-sm whitespace-pre-line break-words text-tinta-suave">{item.notes}</span> : null}
      <div className="-ml-3 flex flex-wrap gap-1">
        {item.lead ? (
          <Link href={`/fornecedor/pedidos/${item.lead.id}`} className={LINK_DO_PEDIDO}>
            Ver pedido
            <span className="sr-only"> de {item.lead.coupleName}</span>
          </Link>
        ) : null}
        <BotaoDeExcluirEvento eventId={item.id} label={item.type === "BLOCKED" ? "Desbloquear" : "Excluir"} />
      </div>
    </>
  );
}

function Compromisso({ item, today, todayIso }: { item: Proximo; today: Date; todayIso: string }) {
  const time = item.type === "MEETING" ? formatarHoraDoPainel(item.time) : null;
  const label = `${rotuloDoDia(item.date, today)}${time ? ` · ${time}` : ""}`;
  const tom = paraDataIso(item.date) === todayIso ? "sucesso" : item.type === "WEDDING" ? "salvia" : "neutro";
  return (
    <article className={cn(ESTILO_DO_CARTAO, "flex flex-col gap-1.5 p-4")}>
      <EtiquetaBase tone={tom}>{label}</EtiquetaBase>
      {item.type === "WEDDING" ? (
        <>
          <strong className="text-[17px] font-semibold break-words">Casamento de {item.coupleName}</strong>
          {item.location ? <span className="text-sm text-tinta-suave">{item.location}</span> : null}
          <Link href={`/fornecedor/pedidos/${item.id}`} className={cn("-ml-3 w-fit", LINK_DO_PEDIDO)}>
            Ver pedido
          </Link>
        </>
      ) : (
        <CompromissoDeEvento item={item} />
      )}
    </article>
  );
}

export function ProximosCompromissos({ itens, today, todayIso }: { itens: Proximo[]; today: Date; todayIso: string }) {
  return (
    <section aria-labelledby="proximos-titulo" className="flex flex-col gap-3">
      <h2 id="proximos-titulo" className="text-lg font-semibold">
        Próximos compromissos
      </h2>
      {itens.length === 0 ? (
        <p className={cn(ESTILO_DO_CARTAO, "p-4 text-tinta-suave")}>Nada marcado daqui para frente.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {itens.map((item) => (
            <li key={`${item.type}-${item.id}`}>
              <Compromisso item={item} today={today} todayIso={todayIso} />
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-tinta-suave">Casamentos entram na agenda quando você marca o pedido como Fechado e ele tem data.</p>
    </section>
  );
}
