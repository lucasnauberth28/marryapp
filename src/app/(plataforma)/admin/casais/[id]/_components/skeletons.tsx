import { Esqueleto } from "@/components/ui/skeleton";
import { EsqueletoDeCartao, EsqueletoDeFormulario, EsqueletoDeTexto } from "@/components/skeletons";
import { EsqueletoDasLinhas } from "@/components/plataforma/loading-parts";

/* Esqueletos do detalhe do casal: o corpo de cada aba e a coluna lateral (plano, ações). */

function Lateral() {
  return (
    <aside className="flex flex-col gap-6">
      <EsqueletoDeCartao>
        <div className="flex h-10 items-center">
          <Esqueleto className="h-7 w-28 rounded-lg" />
        </div>
        <EsqueletoDeTexto lines={2} size="sm" className="mt-1" />
        <Esqueleto className="mt-4 h-9 w-36 rounded-xl" />
      </EsqueletoDeCartao>
      <EsqueletoDeCartao>
        <EsqueletoDasLinhas rows={3} chip={false} />
      </EsqueletoDeCartao>
      <EsqueletoDeCartao>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Esqueleto key={i} className="h-11 rounded-xl" />
          ))}
        </div>
      </EsqueletoDeCartao>
    </aside>
  );
}

function LinhasDeRotuloEValor({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid gap-1 sm:grid-cols-[170px_1fr]">
          <Esqueleto className="h-4 w-24 rounded-md" />
          <Esqueleto className="h-4 w-56 max-w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}

const DUAS_COLUNAS = "grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start";
const METADES = "grid gap-6 lg:grid-cols-2 lg:items-start";

export function EsqueletoDaAbaDoCasal({ tab }: { tab: string }) {
  if (tab === "visao")
    return (
      <div className={DUAS_COLUNAS}>
        <div className="flex min-w-0 flex-col gap-6">
          <EsqueletoDeCartao>
            <LinhasDeRotuloEValor rows={7} />
          </EsqueletoDeCartao>
          <EsqueletoDeCartao>
            <EsqueletoDasLinhas rows={3} chip={false} />
          </EsqueletoDeCartao>
          <EsqueletoDeCartao>
            <EsqueletoDasLinhas rows={4} chip={false} />
          </EsqueletoDeCartao>
        </div>
        <Lateral />
      </div>
    );
  if (tab === "pagamentos")
    return (
      <div className={DUAS_COLUNAS}>
        <div className="flex min-w-0 flex-col gap-6">
          <EsqueletoDeCartao>
            <EsqueletoDasLinhas rows={3} />
          </EsqueletoDeCartao>
          <EsqueletoDeCartao title={false}>
            <EsqueletoDeFormulario fields={["input", "textarea"]} />
          </EsqueletoDeCartao>
          <EsqueletoDeCartao>
            <EsqueletoDeFormulario fields={["input", "textarea"]} />
          </EsqueletoDeCartao>
        </div>
        <Lateral />
      </div>
    );
  if (tab === "atividade" || tab === "suporte")
    return (
      <div className={METADES}>
        <EsqueletoDeCartao>
          <EsqueletoDasLinhas rows={5} chip={false} />
        </EsqueletoDeCartao>
        <EsqueletoDeCartao>
          <EsqueletoDasLinhas rows={4} />
        </EsqueletoDeCartao>
      </div>
    );
  return (
    <EsqueletoDeCartao>
      <EsqueletoDasLinhas rows={3} />
    </EsqueletoDeCartao>
  );
}

export function EsqueletoDoDetalheDoCasal() {
  return (
    <>
      <div className="-mt-2 flex flex-wrap gap-2">
        {[24, 20, 24].map((w, i) => (
          <Esqueleto key={i} className="h-7 rounded-lg" style={{ width: `${w * 4}px` }} />
        ))}
      </div>
    </>
  );
}
