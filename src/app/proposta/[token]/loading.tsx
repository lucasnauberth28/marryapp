import { CARTAO_DA_PAGINA_COM_TOKEN, MoldeDaPaginaComToken } from "@/components/public/token-page-shell";
import { RegiaoDeCarregamento, EsqueletoDeTexto } from "@/components/skeletons";
import { Esqueleto } from "@/components/ui/skeleton";

// A proposta é conferida no servidor: moldura de verdade, título, resumo (valor, data, validade) e o aceite.
export default function PropostaLoading() {
  return (
    <MoldeDaPaginaComToken>
      <RegiaoDeCarregamento label="a proposta" className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex h-4 items-center">
            <Esqueleto className="h-3 w-40 rounded-md" />
          </div>
          <div className="flex h-[38px] items-center sm:h-[46px]">
            <Esqueleto className="h-8 w-3/4 rounded-lg sm:h-10" />
          </div>
          <EsqueletoDeTexto lines={1} lastLineWidth="w-40" />
        </div>
        <div className={`${CARTAO_DA_PAGINA_COM_TOKEN} flex flex-col gap-4`}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1 sm:col-span-2">
              <Esqueleto className="h-3 w-12 rounded-md" />
              <Esqueleto className="h-10 w-40 rounded-lg" />
            </div>
            <div className="flex flex-col gap-1">
              <Esqueleto className="h-3 w-28 rounded-md" />
              <Esqueleto className="h-6 w-40 rounded-md" />
            </div>
            <div className="flex flex-col gap-1">
              <Esqueleto className="h-3 w-20 rounded-md" />
              <Esqueleto className="h-6 w-32 rounded-md" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 border-t border-linha pt-4">
            <Esqueleto className="h-3 w-32 rounded-md" />
            <EsqueletoDeTexto lines={3} />
          </div>
        </div>
        <div className={`${CARTAO_DA_PAGINA_COM_TOKEN} flex flex-col gap-4`}>
          <Esqueleto className="h-6 w-44 rounded-md" />
          <Esqueleto className="h-12 w-full rounded-xl" />
          <Esqueleto className="h-11 w-full rounded-xl" />
        </div>
      </RegiaoDeCarregamento>
    </MoldeDaPaginaComToken>
  );
}
