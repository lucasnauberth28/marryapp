import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, Minus } from "lucide-react";
import { rotuloDePessoas } from "@/lib/dashboard-summary";
import { BlocoDoPainel, Etiqueta, LinkDeTexto } from "../ui";

export interface LinhaDeResposta {
  id: string;
  name: string;
  yes: boolean;
  people: number;
  at: Date;
}

const iniciaisDe = (name: string) => {
  const words = name.trim().split(/\s+/).filter((w) => w.length > 2 || /^\p{Lu}/u.test(w));
  return words.slice(0, 2).map((w) => w[0]).join("").toUpperCase() || name.trim().slice(0, 1).toUpperCase();
};

function LinhaDaResposta({ r }: { r: LinhaDeResposta }) {
  return (
    <li className="grid min-h-[60px] grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 border-t border-linha py-2 first:border-t-0 first:pt-0 last:pb-0">
      <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-areia text-xs font-semibold text-tinta-suave">
        {iniciaisDe(r.name)}
      </span>
      <div className="grid min-w-0">
        <b className="truncate font-semibold text-tinta">{r.name}</b>
        <small className="text-[13px] text-tinta-suave">
          {rotuloDePessoas(r.people)} · {formatDistanceToNowStrict(r.at, { addSuffix: true, locale: ptBR })}
        </small>
      </div>
      {r.yes ? (
        <Etiqueta tone="ok" icon={Check}>
          Confirmado
        </Etiqueta>
      ) : (
        <Etiqueta tone="neutro" icon={Minus}>
          Não vai
        </Etiqueta>
      )}
    </li>
  );
}

/** Últimas respostas (a hora é a da última alteração do convite: o banco ainda não guarda quando a pessoa respondeu). */
export function BlocoDeRespostas({ rows, canOpenList, className = "" }: { rows: LinhaDeResposta[]; canOpenList: boolean; className?: string }) {
  return (
    <BlocoDoPainel id="respostas" title="Últimas respostas" aside={canOpenList && rows.length > 0 ? <LinkDeTexto href="/convidados">Ver todas</LinkDeTexto> : null} className={className}>
      {rows.length === 0 ? (
        <p className="text-[14.5px] leading-[1.45] text-tinta-suave">Nenhum convidado respondeu ainda. As respostas aparecem aqui assim que chegarem.</p>
      ) : (
        <ul>
          {rows.map((r) => (
            <LinhaDaResposta key={r.id} r={r} />
          ))}
        </ul>
      )}
    </BlocoDoPainel>
  );
}
