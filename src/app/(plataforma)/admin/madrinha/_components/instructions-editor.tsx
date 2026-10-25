"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AvisoDoFormulario } from "@/components/ui/field";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { Painel } from "@/components/plataforma/panel";
import { Button } from "@/components/ui/button";
import { Pencil, CheckCircle2, Archive } from "lucide-react";
import { formatarDataEHora } from "@/lib/platform/format";
import { publicarVersaoDasInstrucoes, reverterVersaoDasInstrucoes, salvarVersaoDasInstrucoes } from "@/actions/admin-madrinha-actions";
import { useAcaoDoAdmin } from "../../_sistema/use-admin-action";

export interface ItemDeVersao {
  id: string;
  version: number;
  content: string;
  changeNote: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
  createdByName: string | null;
}

const SITUACAO_DO_ITEM = {
  DRAFT: { tone: "aviso", icon: Pencil, label: "Rascunho" },
  PUBLISHED: { tone: "sucesso", icon: CheckCircle2, label: "Publicada" },
  ARCHIVED: { tone: "neutro", icon: Archive, label: "Anterior" },
} as const;

/** Instruções da Liz com histórico de versões: salvar como nova versão, publicar e reverter. */
export function EditorDeInstrucoes({ versions }: { versions: ItemDeVersao[] }) {
  const latest = versions[0];
  const [text, setText] = useState(latest?.content ?? "");
  const [note, setNote] = useState("");
  const save = useAcaoDoAdmin();
  const row = useAcaoDoAdmin();
  const [rowBusy, setRowBusy] = useState<string | null>(null); // "publicar:<id>" ou "reverter:<id>": só esse botão mostra o spinner
  const changed = text.trim() !== (latest?.content ?? "").trim();
  const st = latest ? SITUACAO_DO_ITEM[latest.status] : null;

  return (
    <Painel
      title="Instruções da Liz"
      aside={st && latest ? <EtiquetaDeSituacao tone={st.tone} icon={st.icon}>{`Versão ${latest.version}, ${st.label.toLowerCase()}`}</EtiquetaDeSituacao> : undefined}
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.run(() => salvarVersaoDasInstrucoes({ content: text, changeNote: note }), () => setNote(""));
        }}
      >
        <Textarea label="O que a Liz deve fazer" value={text} onChange={(e) => setText(e.target.value)} rows={10} error={save.errors.content} maxLength={8000} />
        <Input label="O que mudou nesta versão" value={note} onChange={(e) => setNote(e.target.value)} error={save.errors.changeNote} maxLength={160} />
        {save.formError && !Object.keys(save.errors).length && <AvisoDoFormulario>{save.formError}</AvisoDoFormulario>}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!changed} loading={save.pending}>
            Salvar como nova versão
          </Button>
          <Button
            type="button"
            variant="quiet"
            disabled={!changed || save.pending}
            onClick={() => {
              setText(latest?.content ?? "");
              setNote("");
              save.clear();
            }}
          >
            Descartar mudanças
          </Button>
        </div>
      </form>

      <h3 className="mb-3 mt-8 text-lg font-semibold leading-6 text-tinta">Histórico de versões</h3>
      {row.formError && <AvisoDoFormulario>{row.formError}</AvisoDoFormulario>}
      <ul className="divide-y divide-linha overflow-hidden rounded-2xl border border-linha">
        {versions.map((v) => {
          const s = SITUACAO_DO_ITEM[v.status];
          return (
            <li key={v.id} className={v.status === "DRAFT" && v.id === latest?.id ? "bg-ameixa-suave/60" : undefined}>
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-tinta">
                    Versão {v.version}
                    <EtiquetaDeSituacao tone={s.tone} icon={s.icon}>
                      {s.label}
                    </EtiquetaDeSituacao>
                  </p>
                  <p className="text-sm leading-5 text-tinta-suave">
                    {formatarDataEHora(new Date(v.createdAt))}
                    {v.changeNote ? ` · ${v.changeNote}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {v.status !== "PUBLISHED" && (
                    <Button
                      type="button"
                      variant="quiet"
                      size="sm"
                      disabled={row.pending}
                      loading={row.pending && rowBusy === `publicar:${v.id}`}
                      onClick={() => {
                        setRowBusy(`publicar:${v.id}`);
                        row.run(() => publicarVersaoDasInstrucoes({ id: v.id }));
                      }}
                    >
                      Publicar
                    </Button>
                  )}
                  {v.id !== latest?.id && (
                    <Button
                      type="button"
                      variant="quiet"
                      size="sm"
                      disabled={row.pending}
                      loading={row.pending && rowBusy === `reverter:${v.id}`}
                      onClick={() => {
                        setRowBusy(`reverter:${v.id}`);
                        row.run(() => reverterVersaoDasInstrucoes({ id: v.id }));
                      }}
                    >
                      Reverter para esta
                    </Button>
                  )}
                </div>
              </div>
              <details className="px-4 pb-3 text-sm">
                <summary className="cursor-pointer text-ameixa underline-offset-2 hover:underline">Ver o texto desta versão</summary>
                <p className="mt-2 whitespace-pre-line rounded-xl bg-areia p-3 leading-5 text-tinta">{v.content}</p>
              </details>
            </li>
          );
        })}
      </ul>
    </Painel>
  );
}
