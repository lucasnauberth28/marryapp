"use client";
// Os fornecedores que o casal contratou, o que ainda falta escolher e o cadastro de cada um.
import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CabecalhoDaPagina } from "@/components/admin/page-header";
import { estiloDoBotao } from "@/components/landing/styles";
import { useEstadoSincronizado } from "@/hooks/use-synced-state";
import { ColunaDosContratados } from "./componentes/coluna-dos-contratados";
import { ColunaQueFalta } from "./componentes/coluna-que-falta";
import { DialogoDoFornecedor } from "./componentes/dialogo-do-fornecedor";
import { ModalDeRemocaoDoFornecedor } from "./componentes/modal-de-remocao";
import { categoriasQueFaltam, type FornecedorDoCasamento } from "./componentes/tipos";
import { useFormularioDoFornecedor } from "./componentes/use-formulario-do-fornecedor";

export function FornecedoresCliente({ initialVendors }: { initialVendors: FornecedorDoCasamento[] }) {
  const [vendors, setVendors] = useEstadoSincronizado<FornecedorDoCasamento[]>(initialVendors);
  const [paraRemover, setParaRemover] = useState<FornecedorDoCasamento | null>(null);
  const formulario = useFormularioDoFornecedor();

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoDaPagina
        eyebrow="Organização"
        title="Meus fornecedores"
        description={vendors.length === 0 ? "Registrem aqui quem vocês contrataram." : `${vendors.length} ${vendors.length === 1 ? "contratado" : "contratados"}`}
        actions={
          <>
            <Link href="/fornecedores" className={estiloDoBotao.secondary}>
              Encontrar fornecedores
            </Link>
            <button type="button" onClick={() => formulario.abrir(null)} className={estiloDoBotao.primary}>
              <Plus className="size-4" aria-hidden="true" /> Adicionar fornecedor
            </button>
          </>
        }
      />
      <div className="grid items-start gap-4 md:grid-cols-2">
        <ColunaDosContratados fornecedores={vendors} aoAdicionar={() => formulario.abrir(null)} aoEditar={formulario.abrir} aoRemover={setParaRemover} />
        <ColunaQueFalta categorias={categoriasQueFaltam(vendors)} />
      </div>
      <DialogoDoFornecedor f={formulario} />
      <ModalDeRemocaoDoFornecedor fornecedor={paraRemover} aoFechar={() => setParaRemover(null)} aoRemovido={(id) => setVendors((prev) => prev.filter((x) => x.id !== id))} />
    </div>
  );
}
