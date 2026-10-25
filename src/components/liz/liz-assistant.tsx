"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { EVENTO_DE_ABRIR_A_LIZ } from "@/lib/liz/events";
import { deveMostrarOAtalhoDaLiz } from "@/lib/liz/visibility";
import { BotaoDaLiz } from "./assistente/botao";
import { useComportamentoDoPainelAberto } from "./assistente/use-painel-aberto";
import { useTelaMovel } from "./assistente/use-tela-movel";
import { PainelDaLiz } from "./liz-panel";
import { useLizEscondida } from "./use-liz-hidden";
import "./liz.css";

/**
 * Acesso rápido fixo à Liz: botão flutuante no painel do casal e a conversa que ele abre.
 * Posição: sempre no canto inferior direito. No celular é redondo (56px), acima da barra inferior e da área segura;
 * no computador é uma pílula com o rosto e o nome. A conversa é um popover de 400px ancorado ao botão no computador
 * e uma folha inferior no celular.
 * Hoje a Liz conversa por assuntos prontos: sugere o próximo passo e responde dúvidas pelo guia de ajuda; não é IA livre.
 */

/** O atributo avisa os avisos (sonner) e os botões de adicionar do celular que o botão da Liz está na tela;
 * outros pontos do painel (o cartão de sugestão) pedem para abrir a Liz por evento. */
function useSinaisDoAtalho(visible: boolean, abrir: () => void) {
  useEffect(() => {
    if (!visible) return;
    document.body.setAttribute("data-liz-fab", "");
    return () => document.body.removeAttribute("data-liz-fab");
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    window.addEventListener(EVENTO_DE_ABRIR_A_LIZ, abrir);
    return () => window.removeEventListener(EVENTO_DE_ABRIR_A_LIZ, abrir);
  }, [visible, abrir]);
}

interface PropriedadesDaFolha {
  panelRef: React.RefObject<HTMLDivElement | null>;
  panelId: string;
  titleId: string;
  mobile: boolean;
  allowedPaths: readonly string[];
  pathname: string;
  close: (returnFocus: boolean) => void;
}

function FolhaDaLiz({ panelRef, panelId, titleId, mobile, allowedPaths, pathname, close }: PropriedadesDaFolha) {
  return (
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
        <PainelDaLiz allowedPaths={allowedPaths} pathname={pathname} titleId={titleId} onClose={() => close(true)} onNavigate={() => close(false)} />
      </div>
    </>
  );
}

export function AssistenteLiz({ allowedPaths }: { allowedPaths: readonly string[] }) {
  const pathname = usePathname();
  const visible = deveMostrarOAtalhoDaLiz(pathname);
  const hidden = useLizEscondida();
  const mobile = useTelaMovel();
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
  const abrir = useCallback(() => setOpenAt(pathname), [pathname]);

  useSinaisDoAtalho(visible, abrir);
  useComportamentoDoPainelAberto({ open, mobile, panelRef, fabRef, close });

  if (!visible) return null;

  return (
    <>
      <BotaoDaLiz fabRef={fabRef} open={open} hidden={hidden} panelId={panelId} onClick={() => (open ? close(false) : abrir())} />
      {open && <FolhaDaLiz panelRef={panelRef} panelId={panelId} titleId={titleId} mobile={mobile} allowedPaths={allowedPaths} pathname={pathname} close={close} />}
    </>
  );
}
