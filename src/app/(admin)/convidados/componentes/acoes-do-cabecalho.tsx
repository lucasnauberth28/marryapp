import { Download, Plus, Upload } from "lucide-react";
import { estiloDoBotao } from "@/components/painel/styles";

export function AcoesDoCabecalho({ temConvidados, aoImportar, aoAdicionar }: { temConvidados: boolean; aoImportar: () => void; aoAdicionar: () => void }) {
  return (
    <>
      <button type="button" onClick={aoImportar} className={estiloDoBotao.secondary}>
        <Upload className="size-4" aria-hidden="true" />
        Importar lista
      </button>
      {temConvidados && (
        <a href="/api/export/guests" download="convidados.csv" className={estiloDoBotao.secondary}>
          <Download className="size-4" aria-hidden="true" />
          Exportar CSV
        </a>
      )}
      {/* Com a lista vazia, a ação fica no próprio estado vazio (um só botão com este nome) */}
      {temConvidados && (
        <button type="button" onClick={aoAdicionar} className={`${estiloDoBotao.primary} max-md:hidden`}>
          <Plus className="size-4" aria-hidden="true" />
          Adicionar convidado
        </button>
      )}
    </>
  );
}
