import { estiloDoBotao } from "@/components/landing/styles";
import { cn } from "@/lib/utils";
import { formatarData } from "./datas";

interface PropriedadesDoAviso {
  planName: string;
  daysLeft: number;
  expiresAt: Date;
  hasActivePeriod: boolean;
  now: Date;
}

export function AvisoDeRenovacao({ planName, daysLeft, expiresAt, hasActivePeriod, now }: PropriedadesDoAviso) {
  const titulo = !hasActivePeriod ? `Seu ${planName} venceu` : daysLeft === 0 ? `Seu ${planName} vence hoje` : `Seu ${planName} vence em ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}`;
  const texto = hasActivePeriod
    ? `Renove até ${formatarData(expiresAt, now, true)} para não voltar ao Start. Renovar antes soma os dias que faltam.`
    : `O período pago terminou em ${formatarData(expiresAt, now, true)}. Renove para continuar com os benefícios do ${planName}.`;
  return (
    <div role="status" className="flex flex-col gap-3 rounded-2xl bg-aviso-suave px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
      <div className="flex flex-col gap-0.5">
        <strong className="font-semibold">{titulo}</strong>
        <span className="text-sm text-tinta-suave">{texto}</span>
      </div>
      <a href="#pagar" className={cn(estiloDoBotao.primary, estiloDoBotao.sm, "min-h-11 shrink-0")}>
        Renovar agora
      </a>
    </div>
  );
}

export function CartaoDoPlanoAtual({ planName, details }: { planName: string; details: { label: string; value: string }[] }) {
  return (
    <section aria-labelledby="plano-atual-titulo" className="flex flex-col gap-4 rounded-2xl border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-1)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-col gap-0.5">
        <h2 id="plano-atual-titulo" className="text-sm text-tinta-suave">
          Plano atual
        </h2>
        <p className="font-display text-4xl leading-10">{planName}</p>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:gap-8">
        {details.map((d) => (
          <div key={d.label}>
            <dt className="text-sm text-tinta-suave">{d.label}</dt>
            <dd className="font-semibold">{d.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
