import { Painel } from "@/components/plataforma/panel";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { formatarDataEHora } from "@/lib/platform/format";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { rotuloDoItem } from "./edicao";

interface DetalhesDaAuditoria {
  before?: { priceCents?: number; name?: string };
  after?: { priceCents?: number; name?: string };
  reason?: string;
}

interface Mudanca {
  id: string;
  actorName: string | null;
  targetId: string | null;
  details: unknown;
  createdAt: Date;
}

const preco = (centavos: number | undefined) => (typeof centavos === "number" ? formatarReais(centavos) : "?");

function ItemDeMudanca({ h }: { h: Mudanca }) {
  const d = (h.details ?? {}) as DetalhesDaAuditoria;
  return (
    <li className="border-b border-linha py-3 text-sm first:pt-0 last:border-b-0 last:pb-0">
      <p className="font-semibold text-tinta">{rotuloDoItem(h.targetId)}</p>
      <p className="text-tinta">
        {preco(d.before?.priceCents)} para {preco(d.after?.priceCents)}
      </p>
      {d.reason ? <p className="text-tinta-suave">Motivo: {d.reason}</p> : null}
      <p className="text-tinta-suave">
        {h.actorName ?? "Administração"} · {formatarDataEHora(h.createdAt)}
      </p>
    </li>
  );
}

export function PainelDeMudancas({ history }: { history: Mudanca[] }) {
  return (
    <Painel title="Últimas mudanças">
      {history.length === 0 ? (
        <EstadoVazio title="Nenhuma mudança de preço ainda" compact>Os preços estão como no código do Aceito.</EstadoVazio>
      ) : (
        <ul className="flex flex-col">
          {history.map((h) => (
            <ItemDeMudanca key={h.id} h={h} />
          ))}
        </ul>
      )}
    </Painel>
  );
}
