import { ArrowLeft, ArrowRight, Check, type Heart } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { cn } from "@/lib/utils";
import { formatarPrecoDoPlano, type EtapaDoCadastro, type OpcaoDePlano } from "../auth-config";

export const ROTULO_DA_ETAPA: Record<EtapaDoCadastro, string> = {
  tipo: "Tipo de conta",
  plano: "Plano",
  dados: "Dados da conta",
  pagamento: "Pagamento",
  pronto: "Pronto",
};

export type TituloRef = React.RefObject<HTMLHeadingElement | null>;

export function Titulo({ ref, title, text }: { ref: React.Ref<HTMLHeadingElement>; title: string; text: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 ref={ref} id="cadastro-titulo" tabIndex={-1} className="font-display text-[30px] font-medium leading-9 tracking-[-0.015em] text-tinta outline-none lg:text-[36px] lg:leading-[42px]">
        {title}
      </h1>
      <p className="text-base leading-6 text-tinta-suave">{text}</p>
    </div>
  );
}

export function Progresso({ step, steps }: { step: EtapaDoCadastro; steps: EtapaDoCadastro[] }) {
  const index = Math.max(0, steps.indexOf(step));
  const n = index + 1;
  const total = steps.length;
  return (
    <div className="mb-6 flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1.5" aria-hidden="true">
          {steps.map((s, i) => (
            <span key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-areia">
              <span className={cn("block h-full origin-left rounded-full bg-ameixa transition-transform duration-500 ease-[var(--ease-aceito)]", i <= index ? "scale-x-100" : "scale-x-0")} />
            </span>
          ))}
        </div>
        <span className="text-sm font-semibold tabular-nums text-tinta-suave">
          Etapa {n} de {total}
        </span>
      </div>
      <p className="sr-only">
        Etapa {n} de {total}: {ROTULO_DA_ETAPA[step]}
      </p>
      <p aria-hidden="true" className="text-sm text-tinta-suave">
        {steps.map((s, i) => (
          <span key={s} className={cn(i === index && "font-semibold text-tinta")}>
            {i > 0 ? " · " : ""}
            {ROTULO_DA_ETAPA[s]}
          </span>
        ))}
      </p>
    </div>
  );
}

export function BotaoVoltar({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label="Voltar" className={cn(estiloDoBotao.secondary, "min-h-12 w-12 shrink-0 px-0")}>
      <ArrowLeft aria-hidden="true" className="size-5" strokeWidth={1.6} />
    </button>
  );
}

interface PropriedadesDoCartaoDeTipo {
  icon: typeof Heart;
  title: string;
  text: string;
  selected: boolean;
  onClick: () => void;
}

export function CartaoDeTipo({ icon: Icon, title, text, selected, onClick }: PropriedadesDoCartaoDeTipo) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group flex w-full cursor-pointer items-center gap-4 rounded-[16px] border bg-papel p-5 text-left transition-[border-color,box-shadow,transform] duration-300 ease-[var(--ease-aceito)] hover:-translate-y-0.5 hover:border-ameixa hover:shadow-[var(--shadow-aceito-2)]",
        selected ? "border-2 border-ameixa" : "border-linha",
      )}
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-[12px] bg-ameixa-suave text-ameixa">
        <Icon aria-hidden="true" className="size-6" strokeWidth={1.6} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-2xl leading-8 text-tinta">{title}</span>
        <span className="mt-0.5 block text-[15px] leading-[22px] text-tinta-suave">{text}</span>
      </span>
      <ArrowRight aria-hidden="true" className="size-5 shrink-0 text-tinta-suave transition-transform duration-300 group-hover:translate-x-1 group-hover:text-ameixa" />
    </button>
  );
}

export function CartaoDePlano({ plan, selected, onSelect }: { plan: OpcaoDePlano; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "relative flex w-full cursor-pointer flex-col rounded-[16px] bg-papel p-5 text-left transition-[border-color,box-shadow] duration-300 ease-[var(--ease-aceito)] hover:shadow-[var(--shadow-aceito-1)]",
        selected ? "border-2 border-ameixa p-[19px] shadow-[var(--shadow-aceito-1)]" : "border border-linha hover:border-linha-forte",
      )}
    >
      <span className="flex items-start gap-3">
        <span aria-hidden="true" className={cn("mt-1 grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors", selected ? "border-ameixa bg-ameixa" : "border-linha-forte bg-papel")}>
          <Check className={cn("size-3 text-on-ameixa transition-opacity", selected ? "opacity-100" : "opacity-0")} strokeWidth={3} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold leading-7 text-tinta">{plan.name}</span>
            {plan.popular ? <span className="inline-flex min-h-6 items-center rounded-[6px] bg-ameixa-suave px-2 text-xs font-semibold text-ameixa">Mais escolhido</span> : null}
          </span>
          <span className="block text-[15px] leading-[22px] text-tinta-suave">{plan.summary}</span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block font-num text-[28px] leading-8 text-tinta">{formatarPrecoDoPlano(plan.price)}</span>
          <span className="block text-sm text-tinta-suave">{plan.period}</span>
        </span>
      </span>
      {/* Os itens do plano aparecem só no selecionado, para a lista caber na tela. */}
      <span className={cn("grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-aceito)]", selected ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
        <span className="overflow-hidden">
          <span className="mt-4 flex flex-col gap-2 border-t border-linha pl-8 pt-4">
            {plan.features.map((f) => (
              <span key={f} className="flex items-start gap-2.5 text-[15px] leading-[22px] text-tinta">
                <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sucesso" strokeWidth={2.25} />
                {f}
              </span>
            ))}
          </span>
        </span>
      </span>
    </button>
  );
}
