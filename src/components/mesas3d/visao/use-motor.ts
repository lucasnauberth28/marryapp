// O motor 3D: nasce quando a tela abre (carregado sob demanda), recebe mesas, cenário, cores e alvo do arrasto.
import { useCallback, useEffect, useState } from "react";
import type { MotorDasMesas3D } from "@/lib/mesas3d/engine";
import type { MesaDeEntrada } from "@/lib/mesas3d/layout";
import type { IdDoCenario } from "@/lib/mesas3d/scenarios";
import type { ConvidadoParaSentar } from "@/lib/mesas3d/seating";
import type { EstadoDaVisao } from "./use-estado";
import type { ReferenciasDaVisao } from "./tipos";

interface Entrada {
  refs: ReferenciasDaVisao;
  estado: EstadoDaVisao;
  tables: MesaDeEntrada[];
  fills: Record<string, string[]>;
  seat: (guest: ConvidadoParaSentar, tableId: string | null) => Promise<boolean>;
}

/** Posiciona os rótulos das mesas sobre o cenário a cada quadro. */
function useAtualizarRotulos({ engineRef, labelRefs }: ReferenciasDaVisao) {
  return useCallback(() => {
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
  }, [engineRef, labelRefs]);
}

/** Cria o motor quando a tela abre (o módulo 3D é carregado sob demanda) e o descarta ao sair. */
function useCriarMotor(refs: ReferenciasDaVisao, estado: EstadoDaVisao, seat: Entrada["seat"], updateLabels: () => void) {
  const { canvasRef, hostRef, engineRef, live } = refs;
  const { setCam, setOpenId, setSelectedId } = estado;
  const [ready, setReady] = useState(false);
  const [noGl, setNoGl] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let engine: MotorDasMesas3D | null = null;
    (async () => {
      const mod = await import("@/lib/mesas3d/engine");
      if (cancelled) return;
      if (!mod.webglEstaDisponivel() || !canvasRef.current || !hostRef.current) return setNoGl(true);
      engine = mod.criarMotorDasMesas3D({
        canvas: canvasRef.current,
        host: hostRef.current,
        onRender: () => updateLabels(),
        onCameraGrab: () => setCam(null),
        onContextLost: () => setNoGl(true),
        onTablePick: (slot) => {
          const { edit: canEdit, selectedId: sel, guests: all } = live.current;
          if (!slot) return setOpenId(null);
          const g = canEdit && sel ? all.find((x) => x.id === sel) : undefined;
          if (!g) return setOpenId(slot.id);
          void seat(g, slot.id).then((ok) => ok && setSelectedId(null));
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
  }, [seat, updateLabels, canvasRef, hostRef, engineRef, live, setCam, setOpenId, setSelectedId]);

  return { ready, noGl };
}

export function useMotorDasMesas({ refs, estado, tables, fills, seat }: Entrada) {
  const { engineRef } = refs;
  const { scene, dropId, setCam } = estado;
  const updateLabels = useAtualizarRotulos(refs);

  const { ready, noGl } = useCriarMotor(refs, estado, seat, updateLabels);

  useEffect(() => {
    if (ready) engineRef.current?.setTables(tables);
  }, [ready, tables, engineRef]);

  useCenarioDoMotor(ready, scene, refs, updateLabels, setCam);

  useEffect(() => {
    if (ready) engineRef.current?.setSeating(fills);
  }, [ready, fills, engineRef]);

  useEffect(() => {
    engineRef.current?.setDropTarget(dropId);
  }, [dropId, engineRef]);

  return { ready, noGl, updateLabels };
}

/** Troca o cenário: o desenho trava o navegador por um instante, então o aviso aparece antes. */
function useCenarioDoMotor(ready: boolean, scene: IdDoCenario | null, { engineRef, loadingRef }: ReferenciasDaVisao, updateLabels: () => void, setCam: EstadoDaVisao["setCam"]) {
  useEffect(() => {
    const eng = engineRef.current;
    if (!ready || !eng || !scene) return;
    const cover = loadingRef.current;
    if (cover) cover.hidden = false;
    const id = window.setTimeout(() => {
      eng.setScene(scene);
      setCam("cenario");
      if (cover) cover.hidden = true;
      updateLabels();
    }, 40);
    return () => window.clearTimeout(id);
  }, [ready, scene, updateLabels, engineRef, loadingRef, setCam]);
}
