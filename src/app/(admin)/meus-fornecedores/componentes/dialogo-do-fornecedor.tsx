import { useId } from "react";
import { BotaoComCarregamento } from "@/components/painel/loading-button";
import { estiloDoBotao } from "@/components/landing/styles";
import { ConteudoDoDialogo, CabecalhoDoDialogo, DescricaoDoDialogo, Dialogo, TituloDoDialogo } from "@/components/ui/dialog";
import { Entrada } from "@/components/ui/input";
import { Rotulo } from "@/components/ui/label";
import { AreaDeTexto } from "@/components/ui/textarea";
import { CATEGORIAS_COMUNS } from "./tipos";
import type { FormularioAberto } from "./use-formulario-do-fornecedor";

function CampoDoContrato({ id, f }: { id: string; f: FormularioAberto }) {
  const { arquivo, editando } = f;
  return (
    <div>
      <Rotulo htmlFor={id} className="mb-1 block text-sm font-semibold text-tinta">
        Contrato <span className="font-normal text-tinta-suave">(opcional, até 8 MB)</span>
      </Rotulo>
      <input
        key={arquivo.chave}
        id={id}
        type="file"
        accept=".pdf,image/*"
        onChange={arquivo.aoEscolher}
        className="block min-h-11 w-full cursor-pointer rounded-xl border border-linha-forte bg-papel p-2 text-sm text-tinta file:mr-3 file:rounded-lg file:border-0 file:bg-ameixa-suave file:px-3 file:py-1.5 file:font-semibold file:text-ameixa"
      />
      {arquivo.nome && <p className="mt-1 text-sm text-tinta-suave">Arquivo escolhido: {arquivo.nome}</p>}
      {editando?.contractUrl && !arquivo.nome && <p className="mt-1 text-sm text-tinta-suave">Já há um contrato anexado. Escolher outro arquivo troca o atual.</p>}
    </div>
  );
}

export function DialogoDoFornecedor({ f }: { f: FormularioAberto }) {
  const uid = useId();
  const { form, setForm, editando } = f;
  return (
    <Dialogo open={f.aberto} onOpenChange={f.setAberto}>
      <ConteudoDoDialogo className="max-h-[90vh] max-w-md overflow-y-auto rounded-2xl bg-papel">
        <CabecalhoDoDialogo>
          <TituloDoDialogo className="font-display text-2xl font-medium text-tinta">{editando ? "Editar fornecedor" : "Adicionar fornecedor"}</TituloDoDialogo>
          <DescricaoDoDialogo>Quem vocês contrataram e como falar com a pessoa.</DescricaoDoDialogo>
        </CabecalhoDoDialogo>
        <form onSubmit={f.enviar} className="flex flex-col gap-5 pt-3">
          <Entrada id={`${uid}-name`} label="Nome do fornecedor ou da empresa" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Buffet Flor de Sal" required />
          <div>
            <Entrada id={`${uid}-category`} label="Categoria" list={`${uid}-categories`} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex.: Buffet, Fotografia, Decoração" required />
            <datalist id={`${uid}-categories`}>
              {CATEGORIAS_COMUNS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <Entrada id={`${uid}-contact`} label="Contato" hint="Telefone, WhatsApp ou e-mail." value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="(11) 99999-9999" />
          <AreaDeTexto id={`${uid}-notes`} label="Anotações" optional value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          <CampoDoContrato id={`${uid}-contract`} f={f} />
          <BotaoComCarregamento type="submit" className={`${estiloDoBotao.primary} ${estiloDoBotao.block}`} loading={f.loading}>
            {editando ? "Salvar mudanças" : "Adicionar fornecedor"}
          </BotaoComCarregamento>
        </form>
      </ConteudoDoDialogo>
    </Dialogo>
  );
}
