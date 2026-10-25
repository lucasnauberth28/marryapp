import { EsqueletoDeLinhas } from "@/components/painel/skeleton-parts";
import { estiloDaDicaDoPainel } from "@/components/painel/styles";
import { Esqueleto } from "@/components/ui/skeleton";
import { CLASSE_DO_TITULO } from "./tipos";

export function EtapaImportando({ titulo }: { titulo: React.Ref<HTMLHeadingElement> }) {
  return (
    <div className="flex flex-col gap-5 py-4" role="status" aria-live="polite" aria-busy="true">
      <div className="flex flex-col gap-1">
        <h3 ref={titulo} tabIndex={-1} className={CLASSE_DO_TITULO}>
          Importando a lista...
        </h3>
        <p className={estiloDaDicaDoPainel}>Isso leva só um instante. Não feche esta janela.</p>
      </div>
      {/* Esqueleto da confirmação que vem a seguir: três números e a lista de quem entrou */}
      <div aria-hidden="true" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Esqueleto key={i} className="h-[72px] rounded-xl" />
        ))}
      </div>
      <EsqueletoDeLinhas rows={3} lines={1} className="rounded-xl border border-linha px-4" />
    </div>
  );
}
