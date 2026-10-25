import { estiloDoBotao } from "@/components/landing/styles";
import { BotaoComCarregamento } from "@/components/painel/loading-button";

interface PropriedadesDoRodape {
  pendente: boolean;
  rotuloDeSalvar: string;
  aoCancelar: () => void;
  aoSalvar: () => void;
}

export function RodapeDoFormularioDeAcesso({ pendente, rotuloDeSalvar, aoCancelar, aoSalvar }: PropriedadesDoRodape) {
  return (
    <div className="flex flex-wrap justify-end gap-3 border-t border-linha pt-4">
      <button type="button" className={estiloDoBotao.secondary} onClick={aoCancelar} disabled={pendente}>
        Cancelar
      </button>
      <BotaoComCarregamento className={estiloDoBotao.primary} onClick={aoSalvar} loading={pendente}>
        {rotuloDeSalvar}
      </BotaoComCarregamento>
    </div>
  );
}
