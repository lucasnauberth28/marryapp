import { AvatarDaLiz } from "../liz-illustration";
import { CorpoDaDica } from "./corpo-da-dica";
import { CorpoDoArtigo } from "./corpo-do-artigo";
import type { MensagemDoChat, SituacaoDoCarregamento } from "./tipos";
import type { ResultadoDaAjuda } from "@/lib/liz/help-search";

const ENTRADA = "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200";

interface PropriedadesDaMensagem {
  m: MensagemDoChat;
  primeira: boolean;
  load: SituacaoDoCarregamento;
  hitById: Map<string, ResultadoDaAjuda>;
  canOpenPlans: boolean;
  onRetry: () => void;
  onNavigate: () => void;
}

function MensagemDaLiz({ m, primeira, load, hitById, canOpenPlans, onRetry, onNavigate }: PropriedadesDaMensagem) {
  return (
    <div className={`flex max-w-[92%] items-end gap-2 self-start ${ENTRADA}`}>
      {primeira ? <AvatarDaLiz size={28} decorative className="mb-0.5" /> : <span aria-hidden="true" className="w-7 shrink-0" />}
      <div className="min-w-0 rounded-2xl rounded-bl-md bg-areia px-3.5 py-2.5 text-[15px] leading-6 text-tinta">
        {m.kind === "text" ? <p className="whitespace-pre-line">{m.text}</p> : null}
        {m.kind === "tip" ? <CorpoDaDica load={load} onRetry={onRetry} onNavigate={onNavigate} /> : null}
        {m.kind === "article" ? <CorpoDoArtigo hit={hitById.get(m.articleId)} canOpenPlans={canOpenPlans} onNavigate={onNavigate} /> : null}
      </div>
    </div>
  );
}

interface PropriedadesDoLog extends Omit<PropriedadesDaMensagem, "m" | "primeira"> {
  msgs: MensagemDoChat[];
  asking: boolean;
  logRef: React.RefObject<HTMLDivElement | null>;
}

export function ConversaComALiz({ msgs, asking, logRef, ...resto }: PropriedadesDoLog) {
  return (
    <div ref={logRef} data-lenis-prevent role="log" aria-live="polite" aria-label="Conversa com a Liz" className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-4">
      {msgs.map((m, i) =>
        m.from === "you" ? (
          <p key={m.id} className={`max-w-[85%] self-end rounded-2xl rounded-br-md bg-ameixa px-3.5 py-2 text-[15px] leading-6 text-on-ameixa ${ENTRADA}`}>
            {m.kind === "text" ? m.text : null}
          </p>
        ) : (
          <MensagemDaLiz key={m.id} m={m} primeira={msgs[i - 1]?.from !== m.from} {...resto} />
        ),
      )}
      {asking ? (
        <div className="flex items-end gap-2 self-start" role="status">
          <AvatarDaLiz size={28} decorative />
          <p className="rounded-2xl rounded-bl-md bg-areia px-3.5 py-2.5 text-[15px] leading-6 text-tinta-suave">Procurando no guia...</p>
        </div>
      ) : null}
    </div>
  );
}
