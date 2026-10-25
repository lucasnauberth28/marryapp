import { BellRing, Send } from "lucide-react";
import { BotaoComCarregamento } from "@/components/painel/loading-button";
import { Esqueleto } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { SituacaoDoSuporteAoPush } from "@/lib/notifications/push-support";

export const ESTILO_DO_BOTAO =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ameixa focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export const ESTILO_DO_CARTAO = "flex flex-col gap-4 rounded-2xl border border-linha bg-papel p-4 shadow-[var(--shadow-aceito-1)] sm:p-5";

/** O estado do aparelho só se conhece no navegador: reserva o espaço do cartão enquanto verifica. */
export function CartaoVerificando({ className }: { className?: string }) {
  return (
    <div role="status" aria-busy="true" className={cn(ESTILO_DO_CARTAO, className)}>
      <span className="sr-only">Verificando os avisos neste aparelho...</span>
      <div className="flex items-start gap-3.5">
        <Esqueleto className="size-11 shrink-0 rounded-xl" />
        <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
          <Esqueleto className="h-4 w-44 rounded-md" />
          <Esqueleto className="h-4 w-full max-w-md rounded-md" />
        </div>
      </div>
      <Esqueleto className="h-11 w-60 rounded-xl" />
    </div>
  );
}

export function textoDoCartao(on: boolean, support: SituacaoDoSuporteAoPush) {
  if (on) return "Ativados. Você recebe um aviso aqui, mesmo com o Aceito fechado.";
  if (support === "denied") return "Os avisos estão bloqueados neste navegador.";
  if (support === "ios-install") return "No iPhone, os avisos funcionam depois de instalar o Aceito na tela de início.";
  if (support === "unsupported") return "Este navegador não oferece avisos no aparelho. Eles continuam aparecendo no sino.";
  return "Receba um aviso no celular ou no computador quando algo importante acontecer, sem precisar abrir o Aceito.";
}

/** Passo a passo para quem bloqueou os avisos ou usa iPhone (precisa instalar na tela de início). */
export function InstrucoesDoPush({ support }: { support: SituacaoDoSuporteAoPush }) {
  if (support === "denied") {
    return (
      <ol className="list-decimal space-y-1 pl-9 text-sm leading-5 text-tinta-suave">
        <li>Toque no cadeado ao lado do endereço do site.</li>
        <li>Abra as permissões do site e mude Notificações para Permitir.</li>
        <li>Volte para esta página e ative os avisos.</li>
      </ol>
    );
  }
  if (support !== "ios-install") return null;
  return (
    <ol className="list-decimal space-y-1 pl-9 text-sm leading-5 text-tinta-suave">
      <li>No Safari, toque em Compartilhar (o quadrado com a seta para cima).</li>
      <li>Escolha Adicionar à Tela de Início.</li>
      <li>Abra o Aceito pelo ícone novo e volte aqui para ativar os avisos.</li>
      <li className="list-none -ml-5 pt-1 text-xs">Precisa do iOS 16.4 ou mais novo.</li>
    </ol>
  );
}

/** Versão de uma linha, no rodapé do sino: só aparece quando falta ativar. */
export function AtivarNoRodape({ busy, aoAtivar, className }: { busy: boolean; aoAtivar: () => void; className?: string }) {
  return (
    <BotaoComCarregamento
      onClick={aoAtivar}
      loading={busy}
      className={cn(
        "flex min-h-11 w-full cursor-pointer items-center gap-2.5 border-t border-linha bg-ameixa-suave/50 px-4 text-left text-sm font-semibold text-ameixa transition-colors hover:bg-ameixa-suave focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ameixa disabled:opacity-60",
        className,
      )}
    >
      <BellRing aria-hidden="true" className="size-4" />
      Ativar avisos neste aparelho
    </BotaoComCarregamento>
  );
}

export function BotaoDeTeste({ testing, aoTestar }: { testing: boolean; aoTestar: () => void }) {
  return (
    <BotaoComCarregamento onClick={aoTestar} loading={testing} className={cn(ESTILO_DO_BOTAO, "w-fit border border-linha-forte bg-papel text-tinta hover:border-ameixa hover:bg-ameixa-suave")}>
      <Send aria-hidden="true" className="size-4" />
      Enviar um aviso de teste
    </BotaoComCarregamento>
  );
}
