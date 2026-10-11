import { Wrench } from "lucide-react";
import { getMaintenance } from "@/lib/platform/maintenance";
import { formatBackAt, isMaintenanceExempt } from "@/lib/platform/maintenance-core";

/**
 * Faixa no painel do casal enquanto o modo de manutenção está ligado: tudo pode ser lido, nada pode ser salvo.
 * A administração da plataforma não vê a faixa (ela não é barrada).
 */
export async function MaintenanceBanner({ allowedPaths }: { allowedPaths: readonly string[] }) {
  if (isMaintenanceExempt(allowedPaths)) return null;
  const state = await getMaintenance();
  if (!state.enabled) return null;
  const back = formatBackAt(state.backAt);
  return (
    <div role="status" className="mb-6 flex items-start gap-3 rounded-2xl border border-aviso/40 bg-aviso-suave px-4 py-3.5 text-sm leading-5 text-tinta">
      <Wrench className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <p>
        <strong className="font-semibold">Estamos em manutenção.</strong> {state.message} Por enquanto vocês podem olhar tudo, mas não dá para salvar mudanças.
        {back ? ` Voltamos ${back}.` : ""}
      </p>
    </div>
  );
}
