import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { Etiqueta, estiloDoCartao } from "@/components/casal/ui";
import { estiloDoBotao } from "@/components/landing/styles";
import { resumoDoPagamento, type FornecedorDoCasamento } from "./tipos";

interface PropriedadesDaColuna {
  fornecedores: FornecedorDoCasamento[];
  aoAdicionar: () => void;
  aoEditar: (v: FornecedorDoCasamento) => void;
  aoRemover: (v: FornecedorDoCasamento) => void;
}

function CartaoDoFornecedor({ v, aoEditar, aoRemover }: { v: FornecedorDoCasamento } & Pick<PropriedadesDaColuna, "aoEditar" | "aoRemover">) {
  return (
    <li className={`${estiloDoCartao} flex flex-col gap-1.5 p-3.5`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col items-start gap-1.5">
          <Etiqueta tone="salvia" className="min-h-6 text-[13px]">{v.category}</Etiqueta>
          <strong className="font-semibold text-tinta">{v.name}</strong>
        </div>
        <div className="-mr-2 -mt-1 flex shrink-0">
          <button type="button" aria-label={`Editar ${v.name}`} onClick={() => aoEditar(v)} className={`${estiloDoBotao.quiet} !min-w-11 !px-0`}>
            <Pencil className="size-4" aria-hidden="true" />
          </button>
          <button type="button" aria-label={`Remover ${v.name}`} onClick={() => aoRemover(v)} className={`${estiloDoBotao.quiet} !min-w-11 !px-0 text-perigo hover:bg-perigo-suave`}>
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <span className="text-sm text-tinta-suave">{resumoDoPagamento(v)}</span>
      {v.contact && <span className="text-sm text-tinta-suave">{v.contact}</span>}
      {v.contractUrl && (
        <Etiqueta tone="sucesso" icon={Check}>
          Contrato anexado
        </Etiqueta>
      )}
    </li>
  );
}

export function ColunaDosContratados({ fornecedores, aoAdicionar, aoEditar, aoRemover }: PropriedadesDaColuna) {
  return (
    <section aria-labelledby="contratados-titulo" className="flex flex-col gap-2 rounded-2xl bg-areia p-3">
      <h2 id="contratados-titulo" className="mx-2 mb-1 mt-1 flex justify-between text-sm font-semibold text-tinta">
        Contratados <span className="text-tinta-suave">{fornecedores.length}</span>
      </h2>
      {fornecedores.length === 0 ? (
        <div className={`${estiloDoCartao} flex flex-col items-start gap-3 p-4`}>
          <p className="text-[15px] text-tinta-suave">Ainda não há fornecedores aqui. Adicionem o primeiro para acompanhar contato e pagamentos.</p>
          <button type="button" onClick={aoAdicionar} className={`${estiloDoBotao.primary} ${estiloDoBotao.sm}`}>
            <Plus className="size-4" aria-hidden="true" /> Adicionar fornecedor
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {fornecedores.map((v) => (
            <CartaoDoFornecedor key={v.id} v={v} aoEditar={aoEditar} aoRemover={aoRemover} />
          ))}
        </ul>
      )}
    </section>
  );
}
