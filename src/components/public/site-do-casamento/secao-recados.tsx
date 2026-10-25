"use client";
// Mural de recados: formulário para escrever e a lista de recados já deixados.
import { MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { estiloDoBotao } from "@/components/landing/styles";
import { Botao } from "@/components/ui/button";
import { Entrada } from "@/components/ui/input";
import { AreaDeTexto } from "@/components/ui/textarea";
import { FaixaDaSecao } from "./pecas";
import { PREVIA_DO_LIVRO_DE_RECADOS, type RecadoDoLivro } from "./tipos";
import { useRecados, type MuralDeRecados } from "./use-recados";

/** Como o mural se veste em cada modelo: cartão (padrão), só fios finos ou vidro. */
export type VarianteDoMural = "cartao" | "linhas" | "vidro";
const CAIXA: Record<VarianteDoMural, string> = {
  cartao: "rounded-2xl border border-linha bg-papel p-6 shadow-[var(--shadow-aceito-1)]",
  linhas: "border-t border-tinta py-6",
  vidro: "vidro p-6",
};

function FormularioDeRecado({ mural, preview, variante }: { mural: MuralDeRecados; preview: boolean; variante: VarianteDoMural }) {
  return (
    <form id="form-recado" onSubmit={mural.enviar} className={`flex flex-col gap-5 md:max-w-[560px] ${CAIXA[variante]}`}>
      <Entrada id="guestbook-name" label="Seu nome" value={mural.nome} onChange={(e) => mural.setNome(e.target.value)} placeholder="Ex.: Rodrigo e Carol" maxLength={80} disabled={preview} autoComplete="name" />
      <AreaDeTexto id="guestbook-message" label="Mensagem" value={mural.mensagem} onChange={(e) => mural.setMensagem(e.target.value)} placeholder="Desejamos toda a felicidade do mundo..." rows={4} maxLength={1000} disabled={preview} />
      <Botao type="submit" disabled={preview} loading={mural.enviando} className="rounded-[12px] px-6">Enviar recado</Botao>
    </form>
  );
}

function CartaoDeRecado({ recado, variante }: { recado: RecadoDoLivro; variante: VarianteDoMural }) {
  return (
    <li className="contents">
      <figure className={`m-0 flex flex-col gap-3 ${CAIXA[variante]}`}>
        <blockquote className="m-0 whitespace-pre-line break-words font-display text-xl leading-7 text-tinta">{recado.message}</blockquote>
        <figcaption className="text-sm text-tinta-suave">
          {recado.authorName}
          <span aria-hidden="true"> · </span>
          <time dateTime={new Date(recado.createdAt).toISOString()}>{format(new Date(recado.createdAt), "dd/MM/yyyy", { locale: ptBR })}</time>
        </figcaption>
      </figure>
    </li>
  );
}

function ListaDeRecados({ mural, variante }: { mural: MuralDeRecados; variante: VarianteDoMural }) {
  if (mural.recados.length === 0) {
    if (mural.formularioAberto) return null;
    return (
      <p className="m-0 flex items-center gap-3 text-tinta-suave">
        <MessageSquare className="size-5 shrink-0" aria-hidden="true" />
        Seja o primeiro a deixar um recado.
      </p>
    );
  }
  return (
    <>
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-6 p-0">
        {mural.visiveis.map((r) => <CartaoDeRecado key={r.id} recado={r} variante={variante} />)}
      </ul>
      {mural.recados.length > PREVIA_DO_LIVRO_DE_RECADOS && (
        <button type="button" onClick={mural.alternarMostrarTodos} className={`${estiloDoBotao.secondary} self-center`}>
          {mural.mostrarTodos ? "Mostrar menos recados" : `Ver todos os ${mural.recados.length} recados`}
        </button>
      )}
    </>
  );
}

export function SecaoDeRecados({ slug, recadosIniciais, preview, variante = "cartao" }: { slug: string; recadosIniciais: RecadoDoLivro[]; preview: boolean; variante?: VarianteDoMural }) {
  const mural = useRecados(slug, recadosIniciais, preview);
  return (
    <FaixaDaSecao id="recados" tone="areia">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          <h2 className="m-0 font-display text-[34px] font-medium leading-10 text-tinta text-balance md:text-[40px] md:leading-[46px]">Deixe um recado para os noivos</h2>
        </div>
        {!mural.formularioAberto && (
          <button type="button" onClick={mural.abrirFormulario} aria-expanded={mural.formularioAberto} aria-controls="form-recado" disabled={preview} className={`${estiloDoBotao.secondary} max-md:w-full`}>
            Escrever um recado
          </button>
        )}
      </div>
      {mural.formularioAberto && <FormularioDeRecado mural={mural} preview={preview} variante={variante} />}
      <ListaDeRecados mural={mural} variante={variante} />
    </FaixaDaSecao>
  );
}
