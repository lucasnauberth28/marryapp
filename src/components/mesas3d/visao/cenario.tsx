import Link from "next/link";
import { Box, TriangleAlert, X } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import type { PredefinicaoDaCamera } from "@/lib/mesas3d/engine";
import type { PosicaoDaMesa } from "@/lib/mesas3d/layout";
import { corDoConvidado, type ConvidadoParaSentar, type gruposDe, type ocupacaoPorMesa } from "@/lib/mesas3d/seating";
import { cn } from "@/lib/utils";

export function RotuloDaMesa({ slot, used, target, refCb }: { slot: PosicaoDaMesa; used: number; target: boolean; refCb: (el: HTMLDivElement | null) => void }) {
  const full = !slot.decor && used >= slot.cap;
  return (
    <div
      ref={refCb}
      style={{ visibility: "hidden" }}
      className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium tabular-nums shadow-[0_2px_8px_rgba(0,0,0,0.25)]",
        target ? "border-ameixa bg-ameixa text-on-ameixa" : full ? "border-linha bg-papel text-tinta-suave" : "border-linha bg-papel text-tinta",
      )}
    >
      {slot.nome}
      {slot.decor ? null : (
        <>
          {" · "}
          <b className={cn(!target && !full && "text-ameixa")}>
            {used}/{slot.cap}
          </b>
        </>
      )}
    </div>
  );
}

const CAMERAS = [
  ["cenario", "Cenário"],
  ["panoramica", "Panorâmica"],
  ["topo", "De cima"],
] as const;

export function BarraDaCamera({ cam, aoEscolher }: { cam: PredefinicaoDaCamera | null; aoEscolher: (p: PredefinicaoDaCamera) => void }) {
  return (
    <div role="group" aria-label="Câmera" className="absolute bottom-3 left-3 z-[2] inline-flex gap-0.5 rounded-full border border-linha bg-papel/95 p-[3px] backdrop-blur">
      {CAMERAS.map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={cam === id}
          onClick={() => aoEscolher(id)}
          className={cn("min-h-9 cursor-pointer rounded-full px-3.5 text-sm font-medium transition-colors", cam === id ? "bg-ameixa text-on-ameixa" : "text-tinta-suave hover:text-tinta")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

type Ocupacao = ReturnType<typeof ocupacaoPorMesa>[string];

interface PropriedadesDoPainel {
  slot: PosicaoDaMesa;
  ocupacao: Ocupacao;
  edit: boolean;
  groups: ReturnType<typeof gruposDe>;
  aoFechar: () => void;
  aoTirar: (g: ConvidadoParaSentar) => void;
  aoVerDaMesa: () => void;
}

function ConvidadosDaMesa({ ocupacao, edit, groups, aoTirar }: Pick<PropriedadesDoPainel, "ocupacao" | "edit" | "groups" | "aoTirar">) {
  return (
    <ul className="grid max-h-52 gap-1 overflow-auto">
      {ocupacao.guests.length === 0 ? (
        <li className="text-sm text-tinta-suave">Mesa vazia.</li>
      ) : (
        ocupacao.guests.map((g) => (
          <li key={g.id} className="flex items-center justify-between gap-2 border-b border-linha py-1 text-sm text-tinta">
            <span className="flex min-w-0 items-center gap-2">
              <i aria-hidden="true" className="inline-block size-2 shrink-0 rounded-full" style={{ background: corDoConvidado(groups, g) }} />
              <span className="truncate">{g.name}</span>
            </span>
            {edit ? (
              <button type="button" onClick={() => aoTirar(g)} className="min-h-8 shrink-0 cursor-pointer text-xs text-ameixa underline underline-offset-2">
                Tirar
              </button>
            ) : null}
          </li>
        ))
      )}
    </ul>
  );
}

export function PainelDaMesa({ slot, ocupacao, edit, groups, aoFechar, aoTirar, aoVerDaMesa }: PropriedadesDoPainel) {
  return (
    <div role="dialog" aria-label={slot.nome} className="absolute right-3 top-3 z-[2] grid w-[min(290px,calc(100%-24px))] gap-2 rounded-[20px] border border-linha bg-papel p-4 shadow-[var(--shadow-aceito-2)]">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-display text-lg leading-6 text-tinta">{slot.nome}</h2>
        <button type="button" onClick={aoFechar} aria-label="Fechar" className="grid size-9 cursor-pointer place-items-center rounded-lg text-tinta-suave hover:bg-areia">
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
      {slot.decor ? (
        <p className="text-sm leading-5 text-tinta-suave">Cabeceira do cenário. Para sentar convidados nela, criem uma mesa chamada “Mesa dos noivos” na lista de mesas.</p>
      ) : (
        <>
          <p className="text-sm leading-5 text-tinta-suave">
            <span className="tabular-nums">
              {ocupacao.used} de {slot.cap}
            </span>{" "}
            lugares ocupados
          </p>
          {ocupacao.used > slot.cap ? (
            <p className="flex items-center gap-1.5 text-sm font-semibold text-aviso">
              <TriangleAlert aria-hidden="true" className="size-4" /> Mais convidados do que lugares
            </p>
          ) : null}
          <ConvidadosDaMesa ocupacao={ocupacao} edit={edit} groups={groups} aoTirar={aoTirar} />
        </>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        <button type="button" onClick={aoVerDaMesa} className={cn(estiloDoBotao.primary, "min-h-10 gap-2 px-4 text-sm")}>
          <Box aria-hidden="true" className="size-4" /> Ver da mesa
        </button>
      </div>
    </div>
  );
}

export function AvisoSemSuporteAo3D({ edit }: { edit: boolean }) {
  return (
    <div role="alert" className="absolute inset-0 z-[4] grid place-items-center bg-papel p-6 text-center">
      <div className="flex max-w-sm flex-col items-center gap-3">
        <TriangleAlert aria-hidden="true" className="size-8 text-aviso" />
        <p className="font-display text-xl text-tinta">Este aparelho não conseguiu abrir o 3D</p>
        <p className="text-[15px] leading-6 text-tinta-suave">{edit ? "Tentem em outro navegador ou aparelho. Enquanto isso, a lista de mesas continua funcionando." : "Tente em outro navegador ou aparelho. Peça ao casal o número da sua mesa."}</p>
        {edit ? (
          <Link href="/mesas" className={cn(estiloDoBotao.primary, "min-h-11")}>
            Abrir a lista de mesas
          </Link>
        ) : null}
      </div>
    </div>
  );
}
