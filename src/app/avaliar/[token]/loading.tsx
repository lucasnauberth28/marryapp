import { CARTAO_DA_PAGINA_COM_TOKEN, MoldeDaPaginaComToken } from "@/components/public/token-page-shell";
import { RegiaoDeCarregamento, EsqueletoDeTexto } from "@/components/skeletons";
import { Esqueleto } from "@/components/ui/skeleton";

// O link da avaliação é conferido no servidor: moldura de verdade, título e o formulário (estrelas, comentário, envio).
export default function AvaliarLoading() {
  return (
    <MoldeDaPaginaComToken>
      <RegiaoDeCarregamento label="a avaliação" className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex h-4 items-center">
            <Esqueleto className="h-3 w-48 rounded-md" />
          </div>
          <div className="flex h-[38px] items-center sm:h-[46px]">
            <Esqueleto className="h-8 w-4/5 rounded-lg sm:h-10" />
          </div>
          <EsqueletoDeTexto lines={1} lastLineWidth="w-56" />
        </div>
        <div className={`${CARTAO_DA_PAGINA_COM_TOKEN} flex flex-col gap-5`}>
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Esqueleto key={i} className="size-11 rounded-xl" />
            ))}
          </div>
          <Esqueleto className="h-28 w-full rounded-xl" />
          <Esqueleto className="h-11 w-full rounded-xl" />
        </div>
      </RegiaoDeCarregamento>
    </MoldeDaPaginaComToken>
  );
}
