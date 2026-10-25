"use client";

import { useState } from "react";
import { Plus, Pencil, CheckCircle2 } from "lucide-react";
import { Entrada } from "@/components/ui/input";
import { AreaDeTexto } from "@/components/ui/textarea";
import { AvisoDoFormulario } from "@/components/ui/field";
import { Painel } from "@/components/plataforma/panel";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { estiloDoBotao } from "@/components/landing/styles";
import { Botao } from "@/components/ui/button";
import { formatarDiaEMes } from "@/lib/platform/format";
import { arquivarArtigoDeConhecimento, salvarArtigoDeConhecimento } from "@/actions/admin-madrinha-actions";
import { useAcaoDoAdmin } from "../../_sistema/use-admin-action";

export interface ItemDeArtigo {
  id: string;
  title: string;
  content: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  updatedAt: string;
}

/** Base de conhecimento: textos de ajuda que a Liz poderá consultar. Novo texto, editar, publicar, remover. */
export function BaseDeConhecimento({ articles }: { articles: ItemDeArtigo[] }) {
  // editing: null = lista; "novo" = formulário vazio; item = editando
  const [editing, setEditing] = useState<ItemDeArtigo | "novo" | null>(null);
  return (
    <Painel
      title="Base de conhecimento do Aceito"
      aside={
        editing === null ? (
          <button type="button" onClick={() => setEditing("novo")} className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm}`}>
            <Plus className="size-4" aria-hidden="true" /> Novo texto
          </button>
        ) : undefined
      }
      description="A Liz consulta só estes textos e os dados do casal que está conversando. Ela não busca nada na internet."
    >
      {editing === null ? (
        articles.length === 0 ? (
          <p className="rounded-xl bg-areia p-4 text-sm leading-5 text-tinta-suave">Nenhum texto ainda. Escreva respostas para as dúvidas mais comuns dos casais.</p>
        ) : (
          <ul className="divide-y divide-linha overflow-hidden rounded-2xl border border-linha">
            {articles.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold leading-5 text-tinta">{a.title}</p>
                  <p className="text-sm text-tinta-suave">Atualizado em {formatarDiaEMes(new Date(a.updatedAt))}</p>
                </div>
                <div className="flex items-center gap-2">
                  {a.status === "PUBLISHED" ? (
                    <EtiquetaDeSituacao tone="sucesso" icon={CheckCircle2}>
                      Publicado
                    </EtiquetaDeSituacao>
                  ) : (
                    <EtiquetaDeSituacao tone="aviso" icon={Pencil}>
                      Rascunho
                    </EtiquetaDeSituacao>
                  )}
                  <button type="button" onClick={() => setEditing(a)} className={`${estiloDoBotao.quiet} ${estiloDoBotao.sm}`} aria-label={`Editar ${a.title}`}>
                    Editar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : (
        <FormularioDeArtigo key={editing === "novo" ? "novo" : editing.id} article={editing === "novo" ? null : editing} onDone={() => setEditing(null)} />
      )}
    </Painel>
  );
}

function FormularioDeArtigo({ article, onDone }: { article: ItemDeArtigo | null; onDone: () => void }) {
  const [title, setTitle] = useState(article?.title ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const { pending, errors, formError, run } = useAcaoDoAdmin();
  // Qual botão está rodando: só ele mostra o spinner, os outros ficam desabilitados
  const [running, setRunning] = useState<"PUBLISHED" | "DRAFT" | "remove" | null>(null);
  const submit = (status: "DRAFT" | "PUBLISHED") => {
    setRunning(status);
    run(() => salvarArtigoDeConhecimento({ id: article?.id, title, content, status }), onDone);
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit("PUBLISHED");
      }}
    >
      <Entrada label="Título do texto" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} maxLength={120} />
      <AreaDeTexto label="Texto de ajuda" value={content} onChange={(e) => setContent(e.target.value)} rows={8} error={errors.content} maxLength={8000} />
      {formError && !Object.keys(errors).length && <AvisoDoFormulario>{formError}</AvisoDoFormulario>}
      <div className="flex flex-wrap items-center gap-3">
        <Botao type="submit" disabled={pending} loading={pending && running === "PUBLISHED"}>
          Publicar
        </Botao>
        <Botao type="button" variant="outline" disabled={pending} loading={pending && running === "DRAFT"} onClick={() => submit("DRAFT")}>
          Salvar rascunho
        </Botao>
        <Botao type="button" variant="quiet" disabled={pending} onClick={onDone}>
          Cancelar
        </Botao>
        {article && (
          <Botao
            type="button"
            variant="quiet"
            disabled={pending}
            loading={pending && running === "remove"}
            onClick={() => {
              setRunning("remove");
              run(() => arquivarArtigoDeConhecimento({ id: article.id }), onDone);
            }}
            className="text-perigo"
          >
            Remover texto
          </Botao>
        )}
      </div>
    </form>
  );
}
