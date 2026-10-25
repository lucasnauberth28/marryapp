"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { EVENTO_DE_ABRIR_A_LIZ } from "@/lib/liz/events";
import { deveMostrarOAtalhoDaLiz } from "@/lib/liz/visibility";
import { LizAvatar } from "./liz-illustration";
import { LizPanel } from "./liz-panel";
import { useLizHidden } from "./use-liz-hidden";
import "./liz.css";

/**
 * Acesso rápido fixo à Liz: botão flutuante no painel do casal e a conversa que ele abre.
 * Posição: sempre no canto inferior direito. No celular é redondo (56px), acima da barra inferior e da área segura;
 * no computador é uma pílula com o rosto e o nome. A conversa é um popover de 400px ancorado ao botão no computador
 * e uma folha inferior no celular.
 * Hoje a Liz conversa por assuntos prontos: sugere o próximo passo e responde dúvidas pelo guia de ajuda; não é IA livre.
 */

const MOBILE_QUERY = "(max-width: 767px)";
const subscribeMobile = (cb: () => void) => {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const isMobileNow = () => window.matchMedia(MOBILE_QUERY).matches;

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function LizAssistant({ allowedPaths }: { allowedPaths: readonly string[] }) {
  const pathname = usePathname();
  const visible = deveMostrarOAtalhoDaLiz(pathname);
  const hidden = useLizHidden();
  const mobile = useSyncExternalStore(subscribeMobile, isMobileNow, () => false);
  // Guarda a tela em que abriu: ao navegar, a folha fecha sozinha (sem efeito para sincronizar).
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = visible && !hidden && openAt === pathname;
  const fabRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const titleId = useId();

  const close = useCallback((returnFocus: boolean) => {
    setOpenAt(null);
    if (returnFocus) fabRef.current?.focus();
  }, []);

  // O atributo avisa os avisos (sonner) e os botões de adicionar do celular que o botão da Liz está na tela.
  useEffect(() => {
    if (!visible) return;
    document.body.setAttribute("data-liz-fab", "");
    return () => document.body.removeAttribute("data-liz-fab");
  }, [visible]);

  // Outros pontos do painel (o cartão de sugestão) pedem para abrir a Liz.
  useEffect(() => {
    if (!visible) return;
    const onOpen = () => setOpenAt(pathname);
    window.addEventListener(EVENTO_DE_ABRIR_A_LIZ, onOpen);
    return () => window.removeEventListener(EVENTO_DE_ABRIR_A_LIZ, onOpen);
  }, [visible, pathname]);

  // Aberto: foco no painel, Esc e clique fora fecham, no celular a rolagem do fundo trava e o Tab não escapa.
  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(true);
        return;
      }
      if (e.key !== "Tab" || !mobile || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || fabRef.current?.contains(target)) return;
      close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    const previousOverflow = document.body.style.overflow;
    if (mobile) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, mobile, close]);

  if (!visible) return null;

  return (
    <>
      <button
        ref={fabRef}
        type="button"
        data-tour="liz"
        aria-label="Falar com a Liz"
        title="Falar com a Liz"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        hidden={hidden}
        onClick={() => (open ? close(false) : setOpenAt(pathname))}
        className={`liz-fab flex size-14 cursor-pointer items-center justify-center gap-2 rounded-full shadow-[var(--shadow-aceito-2)] transition-[background-color,transform] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ameixa md:size-auto md:h-[52px] md:justify-start md:border md:border-linha md:p-1.5 md:pr-4 md:shadow-[var(--shadow-aceito-1)] ${
          open ? "bg-ameixa text-on-ameixa hover:bg-ameixa-hover md:border-ameixa" : "bg-papel text-tinta ring-2 ring-ameixa motion-safe:hover:scale-105 md:ring-0 md:hover:border-linha-forte md:motion-safe:hover:scale-100"
        }`}
      >
        {/* Fechado: o rosto da Liz (o nome acessível vem do botão); aberto: o X para fechar */}
        {open ? (
          <span className="grid size-10 place-items-center">
            <X className="size-6" aria-hidden="true" />
          </span>
        ) : (
          <LizAvatar size={40} decorative className="max-md:size-[52px]!" />
        )}
        <span className="hidden text-sm font-semibold md:inline" aria-hidden="true">
          Falar com a Liz
        </span>
      </button>

      {open && (
        <>
          {/* Celular: véu atrás da folha; o clique nele fecha */}
          <div aria-hidden="true" className="fixed inset-0 z-50 bg-scrim/40 animate-in fade-in duration-200 md:hidden" />
          <div
            ref={panelRef}
            id={panelId}
            data-liz-panel
            role="dialog"
            aria-modal={mobile ? true : undefined}
            aria-labelledby={titleId}
            tabIndex={-1}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-3xl border-t border-linha bg-papel text-tinta shadow-[var(--shadow-aceito-2)] outline-none animate-in fade-in slide-in-from-bottom-4 duration-200 md:inset-x-auto md:left-auto md:right-6 md:bottom-[calc(1.25rem+52px+12px)] md:h-[min(640px,calc(100dvh-8rem))] md:max-h-none md:w-[400px] md:rounded-2xl md:border"
          >
            <LizPanel
              allowedPaths={allowedPaths}
              pathname={pathname}
              titleId={titleId}
              onClose={() => close(true)}
              onNavigate={() => close(false)}
            />
          </div>
        </>
      )}
    </>
  );
}
