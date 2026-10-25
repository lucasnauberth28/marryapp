"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Box, Image as ImageIcon, Share2, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";
import { colocarConvidadoNaMesa } from "@/actions/table-actions";
import { definirCenarioDasMesas3D } from "@/actions/table3d-actions";
import { estiloDoBotao } from "@/components/landing/styles";
import type { PredefinicaoDaCamera, MotorDasMesas3D } from "@/lib/mesas3d/engine";
import { calcularDisposicao, type MesaDeEntrada, type PosicaoDaMesa } from "@/lib/mesas3d/layout";
import { CENARIO_PADRAO, type IdDoCenario } from "@/lib/mesas3d/scenarios";
import { podeSentar, corDoConvidado, gruposDe, combinaComNome, ocupacaoPorMesa, coresDosLugares, type ConvidadoParaSentar } from "@/lib/mesas3d/seating";
import { cn } from "@/lib/utils";
import { GaleriaDeCenarios } from "./scene-gallery";
import { DialogoDeCompartilhamento } from "./share-dialog";

interface Propriedades {
  mode: "edit" | "view";
  coupleNames: string;
  initialScene: IdDoCenario | null;
  tables: MesaDeEntrada[];
  guests: ConvidadoParaSentar[];
  initialShareToken?: string | null;
}

const iniciaisDoNome = (n: string) => {
  const p = n.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase();
};

/**
 * Mesas em 3D: a lista de convidados ao lado do cenário. No modo "edit" (o casal) dá para arrastar o convidado até a mesa,
 * ou tocar no nome e depois na mesa; no modo "view" (o link compartilhado) só se busca o próprio nome e a câmera leva à mesa.
 */
export function VisaoDasMesas3D({ mode, coupleNames, initialScene, tables, guests: initialGuests, initialShareToken = null }: Propriedades) {
  const edit = mode === "edit";
  const [scene, setScene] = useState<IdDoCenario | null>(initialScene);
  const [galleryOpen, setGalleryOpen] = useState(edit && !initialScene);
  const [guests, setGuests] = useState<ConvidadoParaSentar[]>(initialGuests);
  const [filter, setFilter] = useState<"sem" | "todos">("sem");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [dropId, setDropId] = useState<string | null>(null);
  const [cam, setCam] = useState<PredefinicaoDaCamera | null>("cenario");
  const [shareOpen, setShareOpen] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(initialShareToken);
  const [noGl, setNoGl] = useState(false);
  const [ready, setReady] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MotorDasMesas3D | null>(null);
  const labelRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const ghostRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ guest: ConvidadoParaSentar; x: number; y: number; live: boolean } | null>(null);
  const suppressClickRef = useRef(false);

  const effectiveScene = scene ?? CENARIO_PADRAO;
  const layout = useMemo(() => calcularDisposicao(effectiveScene, tables), [effectiveScene, tables]);
  const groups = useMemo(() => gruposDe(guests), [guests]);
  const occ = useMemo(() => ocupacaoPorMesa(layout.slots.map((s) => s.id), guests), [layout.slots, guests]);
  const slotsById = useMemo(() => new Map(layout.slots.map((s) => [s.id, s])), [layout.slots]);
  const fills = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const s of layout.slots) if (!s.decor) out[s.id] = coresDosLugares(occ[s.id], groups, s.cadeiras);
    return out;
  }, [layout.slots, occ, groups]);

  // Valores que os ouvintes do motor precisam ler sem recriar o motor
  const live = useRef({ edit, selectedId, guests, occ, slotsById, layoutSlots: layout.slots });
  useEffect(() => {
    live.current = { edit, selectedId, guests, occ, slotsById, layoutSlots: layout.slots };
  });

  const updateLabels = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;
    labelRefs.current.forEach((el, id) => {
      const p = eng.project(id);
      if (!p || !p.visible) {
        el.style.visibility = "hidden";
        return;
      }
      el.style.visibility = "visible";
      el.style.left = `${p.x}px`;
      el.style.top = `${p.y}px`;
    });
  }, []);

  /* ---------- Sentar ---------- */
  const seat = useCallback(async (guest: ConvidadoParaSentar, tableId: string | null): Promise<boolean> => {
    const { slotsById: byId, occ: current, guests: all } = live.current;
    const latest = all.find((g) => g.id === guest.id) ?? guest;
    if (tableId) {
      const slot = byId.get(tableId);
      if (!slot || slot.decor) {
        toast("Esta é a cabeceira do cenário. Para sentar convidados nela, criem uma mesa chamada “Mesa dos noivos”.");
        return false;
      }
      if (latest.tableId === tableId) return true;
      if (!podeSentar(slot.cap, current[tableId], latest, tableId)) {
        toast.error(`${slot.nome} está cheia (${slot.cap} ${slot.cap === 1 ? "lugar" : "lugares"}). Aumentem a capacidade na lista de mesas ou escolham outra.`);
        return false;
      }
    }
    const before = latest.tableId;
    setGuests((gs) => gs.map((g) => (g.id === guest.id ? { ...g, tableId } : g)));
    try {
      const res = await colocarConvidadoNaMesa(guest.id, tableId);
      if (!res.success) throw new Error(res.error);
      const first = guest.name.split(" ")[0];
      toast.success(tableId ? `${first} sentou na ${byId.get(tableId)?.nome ?? "mesa"}.` : `${first} voltou para “sem mesa”.`);
      return true;
    } catch (e) {
      setGuests((gs) => gs.map((g) => (g.id === guest.id ? { ...g, tableId: before } : g)));
      toast.error(e instanceof Error && e.message ? e.message : "Não deu para mover o convidado. Tente de novo.");
      return false;
    }
  }, []);

  /* ---------- Motor 3D ---------- */
  useEffect(() => {
    let cancelled = false;
    let engine: MotorDasMesas3D | null = null;
    (async () => {
      const mod = await import("@/lib/mesas3d/engine");
      if (cancelled) return;
      if (!mod.webglEstaDisponivel() || !canvasRef.current || !hostRef.current) {
        setNoGl(true);
        return;
      }
      engine = mod.criarMotorDasMesas3D({
        canvas: canvasRef.current,
        host: hostRef.current,
        onRender: () => updateLabels(),
        onCameraGrab: () => setCam(null),
        onContextLost: () => setNoGl(true),
        onTablePick: (slot) => {
          const { edit: canEdit, selectedId: sel, guests: all } = live.current;
          if (!slot) {
            setOpenId(null);
            return;
          }
          if (canEdit && sel) {
            const g = all.find((x) => x.id === sel);
            if (g) {
              void seat(g, slot.id).then((ok) => {
                if (ok) setSelectedId(null);
              });
              return;
            }
          }
          setOpenId(slot.id);
        },
      });
      engineRef.current = engine;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      engineRef.current = null;
      engine?.dispose();
    };
  }, [seat, updateLabels]);

  useEffect(() => {
    if (ready) engineRef.current?.setTables(tables);
  }, [ready, tables]);

  useEffect(() => {
    const eng = engineRef.current;
    if (!ready || !eng || !scene) return;
    // O desenho do cenário trava o navegador por um instante: deixa o aviso aparecer antes
    const cover = loadingRef.current;
    if (cover) cover.hidden = false;
    const id = window.setTimeout(() => {
      eng.setScene(scene);
      setCam("cenario");
      if (cover) cover.hidden = true;
      updateLabels();
    }, 40);
    return () => window.clearTimeout(id);
  }, [ready, scene, updateLabels]);

  useEffect(() => {
    if (ready) engineRef.current?.setSeating(fills);
  }, [ready, fills]);

  useEffect(() => {
    engineRef.current?.setDropTarget(dropId);
  }, [dropId]);

  /* ---------- Arrastar da lista até a mesa (mouse e caneta; no toque vale tocar no nome e depois na mesa) ---------- */
  useEffect(() => {
    function move(e: PointerEvent) {
      const d = dragRef.current;
      if (!d) return;
      if (!d.live && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6) return;
      d.live = true;
      const ghost = ghostRef.current;
      if (ghost) {
        ghost.hidden = false;
        ghost.textContent = d.guest.name;
        ghost.style.left = `${e.clientX}px`;
        ghost.style.top = `${e.clientY}px`;
      }
      const t = engineRef.current?.tableAtPoint(e.clientX, e.clientY) ?? null;
      setDropId(t && !t.decor ? t.id : null);
    }
    function up(e: PointerEvent) {
      const d = dragRef.current;
      dragRef.current = null;
      if (ghostRef.current) ghostRef.current.hidden = true;
      setDropId(null);
      if (d?.live) {
        const t = engineRef.current?.tableAtPoint(e.clientX, e.clientY) ?? null;
        if (t) void seat(d.guest, t.id);
        suppressClickRef.current = true;
        window.setTimeout(() => (suppressClickRef.current = false), 0);
      }
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [seat]);

  /* ---------- Lista ---------- */
  const q = query.trim();
  const list = useMemo(() => {
    if (!edit) return q ? guests.filter((g) => combinaComNome(g.name, q)) : [];
    return guests.filter((g) => {
      if (filter === "sem" && g.tableId) return false;
      return !q || combinaComNome(g.name, q);
    });
  }, [edit, guests, filter, q]);
  const seatedSeats = guests.reduce((n, g) => n + (g.tableId ? g.seats : 0), 0);
  const totalSeats = guests.reduce((n, g) => n + g.seats, 0);
  const unseated = guests.filter((g) => !g.tableId).length;
  const openSlot = openId ? (slotsById.get(openId) ?? null) : null;
  const openOcc = openSlot ? occ[openSlot.id] : null;

  function focusGuest(g: ConvidadoParaSentar) {
    const eng = engineRef.current;
    if (!g.tableId) {
      toast(`${g.name.split(" ")[0]} ainda não tem mesa.`);
      return;
    }
    eng?.setSearchRing(g.tableId);
    eng?.irParaMesa(g.tableId);
    setCam(null);
    setOpenId(g.tableId);
  }

  function pickScene(id: IdDoCenario) {
    setScene(id);
    setGalleryOpen(false);
    setOpenId(null);
    if (edit) {
      void definirCenarioDasMesas3D(id).then((r) => {
        if (!r.success) toast.error(r.error);
      });
    }
  }

  function goCam(p: PredefinicaoDaCamera) {
    engineRef.current?.preset(p);
    setCam(p);
  }

  const hint = !edit
    ? "Procure seu nome na lista: a câmera leva até a sua mesa. Só o casal altera as mesas."
    : selectedId
      ? `${guests.find((g) => g.id === selectedId)?.name ?? "O convidado"} escolhido. Toque ou clique em uma mesa para sentar.`
      : "Arraste um convidado até a mesa. No celular, toque no nome e depois na mesa. Gire o cenário com o dedo ou o mouse.";

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave">{edit ? "Mesas" : "Mapa das mesas"}</p>
          <h1 className="font-display text-[26px] font-medium leading-8 tracking-[-0.01em] text-tinta md:text-[32px] md:leading-10">{edit ? "Mesas em 3D" : coupleNames}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {edit ? (
            <Link href="/mesas" className={cn(estiloDoBotao.secondary, "min-h-11 gap-2")}>
              <ArrowLeft aria-hidden="true" className="size-4" /> Lista de mesas
            </Link>
          ) : null}
          <button type="button" onClick={() => setGalleryOpen(true)} className={cn(estiloDoBotao.secondary, "min-h-11 gap-2")}>
            <ImageIcon aria-hidden="true" className="size-4" /> Trocar cenário
          </button>
          {edit ? (
            <button type="button" onClick={() => setShareOpen(true)} className={cn(estiloDoBotao.primary, "min-h-11 gap-2")}>
              <Share2 aria-hidden="true" className="size-4" /> {shareToken ? "Link compartilhado" : "Compartilhar"}
            </button>
          ) : null}
        </div>
      </header>

      <div className="grid min-h-0 gap-4 lg:h-[calc(100dvh-13rem)] lg:min-h-[560px] lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Lista */}
        <aside aria-label="Convidados" className="order-2 flex min-h-0 max-h-[60vh] flex-col gap-3 rounded-2xl border border-linha bg-papel p-4 lg:order-1 lg:max-h-none">
          {edit ? (
            <>
              <div className="flex flex-col gap-1.5">
                <p className="text-[15px] leading-5 text-tinta">
                  <strong className="tabular-nums">{seatedSeats}</strong> de <span className="tabular-nums">{totalSeats}</span> lugares com mesa
                </p>
                <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full border border-linha bg-areia">
                  <div className="h-full bg-ameixa transition-[width] duration-200" style={{ width: `${totalSeats ? (seatedSeats / totalSeats) * 100 : 0}%` }} />
                </div>
              </div>
              <div role="group" aria-label="Filtro da lista" className="flex flex-wrap gap-1.5">
                <EtiquetaDeFiltro pressed={filter === "sem"} onClick={() => setFilter("sem")}>
                  Sem mesa <span className="tabular-nums">{unseated}</span>
                </EtiquetaDeFiltro>
                <EtiquetaDeFiltro pressed={filter === "todos"} onClick={() => setFilter("todos")}>
                  Todos
                </EtiquetaDeFiltro>
              </div>
            </>
          ) : (
            <p className="text-[15px] font-semibold leading-5 text-tinta">Encontre a sua mesa</p>
          )}
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={edit ? "Buscar convidado" : "Digite seu nome"}
            aria-label={edit ? "Buscar convidado" : "Digite seu nome"}
            autoComplete="off"
            className="min-h-11 w-full rounded-xl border border-linha-forte bg-papel px-4 text-base text-tinta placeholder:text-tinta-suave"
          />
          <ul aria-label="Lista de convidados" className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-auto">
            {list.length === 0 ? (
              <li className="px-1 py-3 text-sm leading-5 text-tinta-suave">
                {!edit ? (q ? "Nenhum convidado com esse nome." : "Digite seu nome para ver onde sentar.") : guests.length === 0 ? "Ainda não há convidados confirmados." : q ? "Nenhum convidado com esse nome." : "Todos os convidados já têm mesa."}
              </li>
            ) : (
              list.map((g) => {
                const slot = g.tableId ? slotsById.get(g.tableId) : null;
                const selected = selectedId === g.id;
                return (
                  <li
                    key={g.id}
                    data-selected={selected || undefined}
                    onPointerDown={(e) => {
                      if (!edit || e.pointerType === "touch" || e.button !== 0 || (e.target as HTMLElement).closest("select")) return;
                      dragRef.current = { guest: g, x: e.clientX, y: e.clientY, live: false };
                    }}
                    className={cn(
                      "grid grid-cols-[32px_1fr_auto] items-center gap-x-2.5 gap-y-1.5 rounded-xl border px-2.5 py-2 text-left",
                      edit && "cursor-grab touch-pan-y select-none",
                      selected ? "border-ameixa bg-ameixa-suave" : "border-linha bg-papel hover:border-ameixa",
                    )}
                  >
                    <span aria-hidden="true" className="grid size-8 place-items-center rounded-full text-xs font-semibold text-white" style={{ background: corDoConvidado(groups, g) }}>
                      {iniciaisDoNome(g.name)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (suppressClickRef.current) return;
                        if (edit) setSelectedId(selected ? null : g.id);
                        else focusGuest(g);
                      }}
                      className="min-w-0 cursor-pointer text-left"
                    >
                      <span className="block truncate text-[15px] font-medium leading-5 text-tinta">{g.name}</span>
                      <span className="block truncate text-xs leading-4 text-tinta-suave">
                        {g.category ?? "Sem grupo"}
                        {g.seats > 1 ? ` · ${g.seats} lugares` : ""}
                      </span>
                    </button>
                    <span className={cn("max-w-[7rem] truncate rounded-full px-2.5 py-0.5 text-xs font-semibold", slot ? "bg-ameixa-suave text-ameixa" : "bg-aviso-suave text-aviso")}>{slot ? slot.nome : "Sem mesa"}</span>
                    {edit ? (
                      <select
                        aria-label={`Mover ${g.name} para`}
                        value={g.tableId ?? ""}
                        onChange={(e) => void seat(g, e.target.value || null)}
                        className={cn("col-span-2 col-start-2 min-h-9 rounded-lg border border-linha-forte bg-papel px-2 text-sm text-tinta", selected ? "block" : "sr-only focus:not-sr-only focus:block")}
                      >
                        <option value="">Sem mesa</option>
                        {layout.slots
                          .filter((s) => !s.decor)
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.nome}
                            </option>
                          ))}
                      </select>
                    ) : null}
                  </li>
                );
              })
            )}
          </ul>
          {edit && groups.length > 0 ? (
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-tinta-suave" aria-label="Cores dos grupos nas cadeiras">
              {groups.map((gr) => (
                <li key={gr.key} className="flex items-center gap-1.5">
                  <i aria-hidden="true" className="inline-block size-2.5 rounded-full" style={{ background: gr.color }} />
                  {gr.label}
                </li>
              ))}
            </ul>
          ) : null}
        </aside>

        {/* Cena */}
        <section aria-label="Cenário em 3D" ref={hostRef} className="relative order-1 h-[64vh] min-h-[380px] touch-none overflow-hidden rounded-2xl border border-linha bg-[#1a1519] lg:order-2 lg:h-auto">
          <canvas
            ref={canvasRef}
            aria-label="Cenário do casamento em 3D com as mesas. Use a lista ao lado para escolher a mesa de cada convidado."
            className="block size-full"
            onPointerMove={(e) => {
              if (!edit || !selectedId || e.buttons || dragRef.current) return;
              const t = engineRef.current?.tableAtPoint(e.clientX, e.clientY) ?? null;
              setDropId(t && !t.decor ? t.id : null);
            }}
            onPointerLeave={() => {
              if (!dragRef.current) setDropId(null);
            }}
          />

          {/* Rótulos das mesas */}
          <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
            {layout.slots.map((s) => (
              <RotuloDaMesa
                key={s.id}
                slot={s}
                used={occ[s.id]?.used ?? 0}
                target={dropId === s.id}
                refCb={(el) => {
                  if (el) labelRefs.current.set(s.id, el);
                  else labelRefs.current.delete(s.id);
                }}
              />
            ))}
          </div>

          <p className={cn("absolute left-3 top-3 z-[2] max-w-[min(380px,calc(100%-24px))] rounded-xl border border-linha bg-papel/95 px-3 py-2.5 text-[13px] leading-[18px] text-tinta-suave backdrop-blur", openSlot && "hidden sm:block")}>
            <span className="mb-0.5 block font-display text-base leading-5 text-tinta">{layout.scene.nome}</span>
            {hint}
          </p>

          <div role="group" aria-label="Câmera" className="absolute bottom-3 left-3 z-[2] inline-flex gap-0.5 rounded-full border border-linha bg-papel/95 p-[3px] backdrop-blur">
            {(
              [
                ["cenario", "Cenário"],
                ["panoramica", "Panorâmica"],
                ["topo", "De cima"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={cam === id}
                onClick={() => goCam(id)}
                className={cn("min-h-9 cursor-pointer rounded-full px-3.5 text-sm font-medium transition-colors", cam === id ? "bg-ameixa text-on-ameixa" : "text-tinta-suave hover:text-tinta")}
              >
                {label}
              </button>
            ))}
          </div>

          {openSlot && openOcc ? (
            <div role="dialog" aria-label={openSlot.nome} className="absolute right-3 top-3 z-[2] grid w-[min(290px,calc(100%-24px))] gap-2 rounded-[20px] border border-linha bg-papel p-4 shadow-[var(--shadow-aceito-2)]">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display text-lg leading-6 text-tinta">{openSlot.nome}</h2>
                <button type="button" onClick={() => { setOpenId(null); engineRef.current?.setSearchRing(null); }} aria-label="Fechar" className="grid size-9 cursor-pointer place-items-center rounded-lg text-tinta-suave hover:bg-areia">
                  <X aria-hidden="true" className="size-4" />
                </button>
              </div>
              {openSlot.decor ? (
                <p className="text-sm leading-5 text-tinta-suave">Cabeceira do cenário. Para sentar convidados nela, criem uma mesa chamada “Mesa dos noivos” na lista de mesas.</p>
              ) : (
                <>
                  <p className="text-sm leading-5 text-tinta-suave">
                    <span className="tabular-nums">
                      {openOcc.used} de {openSlot.cap}
                    </span>{" "}
                    lugares ocupados
                  </p>
                  {openOcc.used > openSlot.cap ? (
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-aviso">
                      <TriangleAlert aria-hidden="true" className="size-4" /> Mais convidados do que lugares
                    </p>
                  ) : null}
                  <ul className="grid max-h-52 gap-1 overflow-auto">
                    {openOcc.guests.length === 0 ? (
                      <li className="text-sm text-tinta-suave">Mesa vazia.</li>
                    ) : (
                      openOcc.guests.map((g) => (
                        <li key={g.id} className="flex items-center justify-between gap-2 border-b border-linha py-1 text-sm text-tinta">
                          <span className="flex min-w-0 items-center gap-2">
                            <i aria-hidden="true" className="inline-block size-2 shrink-0 rounded-full" style={{ background: corDoConvidado(groups, g) }} />
                            <span className="truncate">{g.name}</span>
                          </span>
                          {edit ? (
                            <button type="button" onClick={() => void seat(g, null)} className="min-h-8 shrink-0 cursor-pointer text-xs text-ameixa underline underline-offset-2">
                              Tirar
                            </button>
                          ) : null}
                        </li>
                      ))
                    )}
                  </ul>
                </>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <button type="button" onClick={() => { engineRef.current?.vistaDaMesa(openSlot.id); setCam(null); }} className={cn(estiloDoBotao.primary, "min-h-10 gap-2 px-4 text-sm")}>
                  <Box aria-hidden="true" className="size-4" /> Ver da mesa
                </button>
              </div>
            </div>
          ) : null}

          <div ref={loadingRef} hidden={!!scene} className="absolute inset-0 z-[3] grid place-items-center bg-[#1a1519] font-display text-lg text-[#F2EEF0]">
            {scene ? "Preparando o cenário..." : "Escolha um cenário para começar."}
          </div>

          {noGl ? (
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
          ) : null}
        </section>
      </div>

      {tables.length === 0 && edit ? (
        <p className="rounded-xl border border-linha bg-areia px-4 py-3 text-sm leading-5 text-tinta-suave">
          O cenário ainda não tem mesas para sentar convidados. <Link href="/mesas" className="font-semibold text-ameixa underline underline-offset-2">Criem as mesas na lista</Link> e elas aparecem aqui.
        </p>
      ) : null}

      <div ref={ghostRef} hidden className="pointer-events-none fixed z-50 translate-x-2.5 translate-y-2.5 rounded-full bg-ameixa px-3 py-1.5 text-sm font-medium text-on-ameixa shadow-[var(--shadow-aceito-2)]" />

      <GaleriaDeCenarios open={galleryOpen} current={scene} onPick={pickScene} onClose={() => setGalleryOpen(false)} />
      {edit ? <DialogoDeCompartilhamento open={shareOpen} onClose={() => setShareOpen(false)} token={shareToken} onChange={setShareToken} /> : null}
    </div>
  );
}

function EtiquetaDeFiltro({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn("min-h-8 cursor-pointer rounded-full border px-3 text-[13px]", pressed ? "border-ameixa bg-ameixa-suave font-semibold text-ameixa" : "border-linha bg-papel text-tinta-suave hover:text-tinta")}
    >
      {children}
    </button>
  );
}

function RotuloDaMesa({ slot, used, target, refCb }: { slot: PosicaoDaMesa; used: number; target: boolean; refCb: (el: HTMLDivElement | null) => void }) {
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
