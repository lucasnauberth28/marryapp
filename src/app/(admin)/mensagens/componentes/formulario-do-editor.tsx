"use client";
// Escrever ou editar uma mensagem: nome, texto com {nome}, links, anexo opcional e a prévia do WhatsApp ao lado.
import { useId, useRef } from "react";
import { Check, ChevronDown, Image as ImageIcon, Link as LinkIcon, Plus, Trash2, UserCheck, X } from "lucide-react";
import { ModalDeConfirmacao } from "@/components/ui/confirm-modal";
import { Entrada } from "@/components/ui/input";
import { AreaDeTexto } from "@/components/ui/textarea";
import { SelecaoNativa } from "@/components/ui/select";
import { BotaoComCarregamento } from "@/components/painel/loading-button";
import { estiloBaseDaEtiqueta, estiloDaDicaDoPainel, estiloDoBotao, estiloDoBotaoDeIcone, estiloDoBotaoDePerigo, estiloDoSobretitulo, estiloDoTomDaEtiqueta } from "@/components/painel/styles";
import { PreviaDoWhatsapp } from "./previa-do-whatsapp";
import { LINKS_DE_PRESENTE, LINKS_PADRAO, MAXIMO_DE_LINKS, type ModeloDeMensagem } from "./tipos";
import { useEditorDeMensagem, type EditorDeMensagem } from "./use-editor-de-mensagem";
import { linksParaPrevia } from "./utilitarios";

function CampoDeTexto({ editor, idDoCampo, campoDoTexto }: { editor: EditorDeMensagem; idDoCampo: string; campoDoTexto: React.RefObject<HTMLTextAreaElement | null> }) {
  return (
    <div className="flex flex-col gap-2">
      <AreaDeTexto id={idDoCampo} label="Texto" ref={campoDoTexto} required rows={7} value={editor.conteudo} onChange={(e) => editor.setConteudo(e.target.value)} placeholder="Oi, {nome}! Aqui são vocês. Ainda não recebemos sua resposta para o casamento..." inputClassName="min-h-44" />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={editor.inserirNome} className={`${estiloBaseDaEtiqueta} ${estiloDoTomDaEtiqueta.neutro} min-h-11 cursor-pointer !pl-3 hover:brightness-95 sm:min-h-8`}>
          <UserCheck className="size-4" aria-hidden="true" />
          Pôr o nome de quem recebe
        </button>
        <span className="text-sm text-tinta-suave">Escreve {"{nome}"}: cada pessoa vê o próprio nome.</span>
      </div>
    </div>
  );
}

function CamposDeLinks({ editor, prefixoDoId }: { editor: EditorDeMensagem; prefixoDoId: string }) {
  const { links, setLinks } = editor;
  return (
    <fieldset className="flex flex-col gap-3 rounded-xl border border-linha p-4">
      <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-tinta">
        <LinkIcon className="size-4" aria-hidden="true" />
        Links no fim da mensagem
      </legend>
      <p className={estiloDaDicaDoPainel}>Cada link leva a pessoa direto ao convite ou à lista de presentes. Até 3.</p>
      {links.map((l, idx) => (
        <div key={l.id} className="flex items-center gap-2">
          <Entrada id={`${prefixoDoId}-link-${idx}`} label={`Texto do link ${idx + 1}`} value={l.text} onChange={(e) => setLinks(links.map((x, i) => (i === idx ? { ...x, text: e.target.value } : x)))} placeholder="Ex.: Confirmar presença" fieldClassName="flex-1" />
          <button type="button" aria-label={`Remover o link ${idx + 1}`} onClick={() => setLinks(links.filter((_, i) => i !== idx))} className={estiloDoBotaoDeIcone}>
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        {links.length < MAXIMO_DE_LINKS ? (
          <button type="button" onClick={editor.adicionarLink} className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm}`}>
            <Plus className="size-4" aria-hidden="true" />
            Adicionar link
          </button>
        ) : null}
        <button type="button" onClick={() => setLinks(LINKS_PADRAO)} className={`${estiloDoBotao.quiet} ${estiloDoBotao.sm}`}>Confirmar ou recusar</button>
        <button type="button" onClick={() => setLinks(LINKS_DE_PRESENTE)} className={`${estiloDoBotao.quiet} ${estiloDoBotao.sm}`}>Presentes e confirmar</button>
      </div>
    </fieldset>
  );
}

function AnexoOpcional({ editor, idDoTipo, idDoLink }: { editor: EditorDeMensagem; idDoTipo: string; idDoLink: string }) {
  return (
    <details className="group rounded-xl border border-linha" open={!!editor.midiaUrl}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-4 text-sm font-semibold text-tinta">
        <span className="flex items-center gap-2">
          <ImageIcon className="size-4" aria-hidden="true" />
          Mandar uma imagem ou arquivo junto (opcional)
        </span>
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="grid gap-5 px-4 pb-4 pt-2 sm:grid-cols-2">
        <SelecaoNativa id={idDoTipo} label="O que é" value={editor.tipoDaMidia} onChange={(e) => editor.setTipoDaMidia(e.target.value)}>
          <option value="image">Foto ou imagem</option>
          <option value="document">Documento em PDF</option>
          <option value="audio">Áudio</option>
        </SelecaoNativa>
        <Entrada id={idDoLink} type="url" label="Link do arquivo" hint="O endereço do arquivo na internet, que começa com https://" value={editor.midiaUrl} onChange={(e) => editor.setMidiaUrl(e.target.value)} placeholder="https://..." />
      </div>
    </details>
  );
}

interface FormularioDoEditorProps {
  template: ModeloDeMensagem | null;
  sampleName: string;
  slug: string;
  customDomain?: string | null;
  coupleNames: string;
  onSaved: (t: ModeloDeMensagem, created: boolean) => void;
  onDeleted: (id: string) => void;
  onCancel: () => void;
}

export function FormularioDoEditor({ template, sampleName, slug, customDomain, coupleNames, onSaved, onDeleted, onCancel }: FormularioDoEditorProps) {
  const ids = { name: useId(), type: useId(), content: useId(), media: useId(), mediaUrl: useId() };
  const campoDoTexto = useRef<HTMLTextAreaElement>(null);
  const editor = useEditorDeMensagem({ modelo: template, campoDoTexto, aoSalvar: onSaved, aoExcluir: onDeleted });
  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <form onSubmit={editor.salvar} className="flex min-w-0 flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Entrada id={ids.name} label="Nome da mensagem" required value={editor.nome} onChange={(e) => editor.setNome(e.target.value)} placeholder="Ex.: Lembrete de confirmação" />
          <SelecaoNativa id={ids.type} label="Para que serve" value={editor.tipo} onChange={(e) => editor.setTipo(e.target.value)}>
            <option value="INITIAL_INVITE">Convite inicial</option>
            <option value="RSVP_REMINDER">Lembrete de confirmação</option>
            <option value="CUSTOM">Outro assunto</option>
          </SelecaoNativa>
        </div>
        <CampoDeTexto editor={editor} idDoCampo={ids.content} campoDoTexto={campoDoTexto} />
        <CamposDeLinks editor={editor} prefixoDoId={ids.name} />
        <AnexoOpcional editor={editor} idDoTipo={ids.media} idDoLink={ids.mediaUrl} />
        <div className="flex flex-wrap items-center gap-2">
          <BotaoComCarregamento type="submit" loading={editor.salvando} className={estiloDoBotao.primary}>
            <Check className="size-4" aria-hidden="true" />
            {template ? "Salvar alterações" : "Salvar mensagem"}
          </BotaoComCarregamento>
          <button type="button" onClick={onCancel} className={estiloDoBotao.secondary}>Cancelar</button>
          {template ? (
            <button type="button" onClick={() => editor.setConfirmandoExclusao(true)} className={`${estiloDoBotaoDePerigo} sm:ml-auto`}>
              <Trash2 className="size-4" aria-hidden="true" />
              Excluir
            </button>
          ) : null}
        </div>
      </form>
      <section aria-label="Prévia no WhatsApp" className="flex min-w-0 flex-col gap-2 lg:sticky lg:top-0">
        <p className={estiloDoSobretitulo}>Como chega</p>
        <PreviaDoWhatsapp coupleNames={coupleNames} text={editor.conteudo} sampleName={sampleName} links={linksParaPrevia(editor.links, slug, customDomain)} hasMedia={!!editor.midiaUrl} mediaType={editor.tipoDaMidia} />
      </section>
      <ModalDeConfirmacao
        isOpen={editor.confirmandoExclusao}
        onClose={() => editor.setConfirmandoExclusao(false)}
        onConfirm={() => {
          editor.setConfirmandoExclusao(false);
          void editor.excluir();
        }}
        title="Excluir mensagem"
        description="Excluir esta mensagem? Não dá para desfazer."
        confirmText="Excluir"
      />
    </div>
  );
}
