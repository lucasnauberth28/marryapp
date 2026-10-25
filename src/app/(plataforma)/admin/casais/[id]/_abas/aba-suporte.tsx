import Link from "next/link";
import { Lock } from "lucide-react";
import { Painel } from "@/components/plataforma/panel";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { estiloDoBotao } from "@/components/landing/styles";
import { formatarData } from "@/lib/platform/format";
import { obterSuporteDoCasal } from "@/lib/platform/queries/casais/abas";
import { cn } from "@/lib/utils";
import { FormularioDeNota } from "../_components/note-form";

const SITUACAO_DO_CHAMADO: Record<string, string> = { NEW: "Novo", IN_PROGRESS: "Em andamento", ANSWERED: "Respondido", CLOSED: "Fechado" };
const LINHA_DE_LISTA = "flex flex-wrap items-center justify-between gap-2 border-b border-linha py-3 first:pt-0 last:border-b-0 last:pb-0";

export async function AbaSuporte({ id }: { id: string }) {
  const { notes, tickets } = await obterSuporteDoCasal(id);
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <Painel title="Notas internas" aside={<EtiquetaDeSituacao tone="neutro" icon={Lock}>Só a equipe vê</EtiquetaDeSituacao>}>
        {notes.length === 0 ? (
          <p className="mb-4 text-tinta-suave">Nenhuma nota ainda.</p>
        ) : (
          <ul className="mb-4 flex flex-col">
            {notes.map((n) => (
              <li key={n.id} className="border-b border-linha py-3 first:pt-0">
                <p className="text-sm text-tinta-suave">
                  {n.authorName} · {formatarData(n.createdAt)}
                </p>
                <p className="whitespace-pre-wrap leading-6 text-tinta">{n.body}</p>
              </li>
            ))}
          </ul>
        )}
        <FormularioDeNota weddingId={id} />
      </Painel>
      <Painel title="Pedidos de ajuda deste casal">
        {tickets.length === 0 ? (
          <p className="text-tinta-suave">Nenhum chamado registrado para este casal.</p>
        ) : (
          <ul className="flex flex-col">
            {tickets.map((t) => (
              <li key={t.id} className={LINHA_DE_LISTA}>
                <span>
                  <span className="block font-semibold">
                    #{t.number} {t.subject}
                  </span>
                  <span className="block text-sm text-tinta-suave">{formatarData(t.createdAt)}</span>
                </span>
                <EtiquetaDeSituacao tone={t.status === "CLOSED" ? "neutro" : "aviso"}>{SITUACAO_DO_CHAMADO[t.status] ?? t.status}</EtiquetaDeSituacao>
              </li>
            ))}
          </ul>
        )}
        <Link href="/admin/suporte" className={cn(estiloDoBotao.secondary, estiloDoBotao.sm, "mt-4")}>
          Abrir Suporte e LGPD
        </Link>
      </Painel>
    </div>
  );
}
