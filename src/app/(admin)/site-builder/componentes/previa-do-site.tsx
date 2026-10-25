import { EscopoClaro } from "@/components/theme/light-scope";
import { VisaoDoSiteDoCasamento } from "@/components/public/site-do-casamento/visao-do-site";
import type { ConfiguracoesDoSiteDoCasamento } from "@/components/public/site-do-casamento/tipos";
import type { Dica, ItemDaHistoria, PresenteDaPrevia } from "./tipos";

interface PropriedadesDaPreviaDoSite {
  slug: string;
  endereco: string;
  alterado: boolean;
  configuracoes: ConfiguracoesDoSiteDoCasamento;
  momentos: ItemDaHistoria[];
  dicas: Dica[];
  presentes: PresenteDaPrevia[];
  rsvpDeadline: Date | string | null;
}

export function PreviaDoSite({ slug, endereco, alterado, configuracoes, momentos, dicas, presentes, rsvpDeadline }: PropriedadesDaPreviaDoSite) {
  return (
    <div className="overflow-hidden rounded-2xl bg-linho shadow-[var(--shadow-aceito-2)]">
      <div className="flex h-9 items-center gap-1.5 border-b border-linha bg-papel px-3">
        <span className="size-2.5 rounded-full bg-linha" aria-hidden="true" />
        <span className="size-2.5 rounded-full bg-linha" aria-hidden="true" />
        <span className="size-2.5 rounded-full bg-linha" aria-hidden="true" />
        <span className="ml-3 min-w-0 flex-1 truncate text-xs text-tinta-suave">{endereco}</span>
        {alterado && <span className="shrink-0 text-xs font-semibold text-aviso">Alterações não publicadas</span>}
      </div>
      {/* O site do casal é sempre claro: a prévia não segue o tema do painel */}
      <EscopoClaro className="h-[72vh] overflow-y-auto">
        <div className="pointer-events-none select-none" style={{ zoom: 0.5 }} aria-hidden="true">
          <VisaoDoSiteDoCasamento slug={slug} settings={configuracoes} storyItems={momentos} tips={dicas} guestbookEntries={[]} gifts={presentes} rsvpDeadline={rsvpDeadline} preview />
        </div>
      </EscopoClaro>
    </div>
  );
}
