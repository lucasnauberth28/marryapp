// Acha o item do passo na tela, espera ele parar de mexer e calcula onde ficam o destaque e o balão.
import { useCallback, useEffect } from "react";
import { posicionarBalao, type Caixa } from "@/lib/tour/positioning";
import type { PassoDoTour } from "@/lib/tour/steps";
import { QUADROS_ESTAVEIS, TEMPO_PARA_DESISTIR_EM_MS, acharAncora, caixaDe, mesmaCaixa, movimentoReduzido, type AncoraResolvida, type TourConcluido } from "./ancora";

/** Calcula onde ficam o destaque e o balão para o item atual. */
export function usePosicionarBalao(dialogRef: React.RefObject<HTMLDivElement | null>, mobile: boolean, setResolved: (r: AncoraResolvida) => void) {
  return useCallback(
    (el: HTMLElement | null, forKey: string) => {
      const box = el ? caixaDe(el) : null;
      const dialog = dialogRef.current;
      const width = dialog?.offsetWidth ?? 340;
      const height = dialog?.offsetHeight ?? 320;
      const vw = { width: window.innerWidth, height: window.innerHeight };
      const prefer = mobile && box ? (box.top + box.height / 2 > vw.height * 0.55 ? "top" : "bottom") : "right";
      setResolved({ key: forKey, box, place: posicionarBalao({ target: box, viewport: vw, balloon: { width, height }, prefer }) });
    },
    [mobile, dialogRef, setResolved],
  );
}

interface Entrada {
  step: PassoDoTour | undefined;
  key: string;
  list: PassoDoTour[];
  dir: 1 | -1;
  isLast: boolean;
  onDone: (done: TourConcluido) => void;
  place: (el: HTMLElement | null, forKey: string) => void;
  anchorRef: React.MutableRefObject<HTMLElement | null>;
  esconderPasso: (id: string) => void;
  voltarUm: () => void;
}

/** Um passo do vigia: devolve true quando o item parou de mexer ou o passo não tem item (acabou a busca). */
function criarVigia(step: PassoDoTour, key: string, place: Entrada["place"], anchorRef: Entrada["anchorRef"], desistir: () => void) {
  let last: Caixa | null = null;
  let stable = 0;
  let scrolled = false;
  const started = performance.now();

  return (): boolean => {
    // Passo sem item para destacar (o botão da Liz fica escondido durante o passo a passo): balão no centro
    if (step.floating) {
      anchorRef.current = null;
      place(null, key);
      return true;
    }
    const el = acharAncora(step.anchor);
    if (!el) {
      if (performance.now() - started <= TEMPO_PARA_DESISTIR_EM_MS) return false;
      desistir();
      return true;
    }
    if (!scrolled) {
      scrolled = true;
      el.scrollIntoView({ block: "center", inline: "nearest", behavior: movimentoReduzido() ? "auto" : "smooth" });
    }
    const box = caixaDe(el);
    stable = last && mesmaCaixa(last, box) ? stable + 1 : 0;
    last = box;
    if (stable < QUADROS_ESTAVEIS) return false;
    anchorRef.current = el;
    place(el, key);
    return true;
  };
}

/** Acha o item do passo (a barra de baixo do celular mostra as 5 áreas, sem "Mais"); espera o item parar de mexer. */
export function useBuscaDaAncora({ step, key, list, dir, isLast, onDone, place, anchorRef, esconderPasso, voltarUm }: Entrada) {
  useEffect(() => {
    if (!step) return;
    let stopped = false;
    let frame = 0;

    const desistir = () => {
      if (list.length <= 1) return onDone({ outcome: "skipped" });
      if (dir > 0 && isLast) return onDone({ outcome: "completed" });
      esconderPasso(step.id);
      if (dir < 0) voltarUm();
    };

    const vigiar = criarVigia(step, key, place, anchorRef, desistir);
    const tick = () => {
      if (stopped || vigiar()) return;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
    };
    // list/dir/isLast/onDone só entram em desistir: o passo e o aparelho decidem quando procurar de novo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
