import { Clock, Megaphone, Settings } from "lucide-react";
import { estiloDoCartao } from "@/components/casal/ui";
import { MODELOS_DE_COMUNICADO } from "@/lib/platform/announcement-models";
import { cn } from "@/lib/utils";

const ICONE_DO_MODELO = { manutencao: Settings, novidade: Megaphone, plano: Clock } as const;

export function ModelosProntos({ aoEscolher }: { aoEscolher: (id: string) => void }) {
  return (
    <section aria-labelledby="modelos-t" className="flex flex-col gap-3">
      <h2 id="modelos-t" className="text-lg font-semibold leading-6 text-tinta">
        Modelos prontos
      </h2>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {MODELOS_DE_COMUNICADO.map((t) => {
          const Icon = ICONE_DO_MODELO[t.id as keyof typeof ICONE_DO_MODELO] ?? Megaphone;
          return (
            <li key={t.id}>
              <button type="button" onClick={() => aoEscolher(t.id)} className={cn(estiloDoCartao, "flex min-h-16 w-full items-center gap-3 p-4 text-left transition-shadow hover:shadow-[var(--shadow-aceito-2)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ameixa")}>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ameixa-suave text-ameixa">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold leading-5 text-tinta">{t.name}</span>
                  <span className="block text-sm leading-5 text-tinta-suave">{t.hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
