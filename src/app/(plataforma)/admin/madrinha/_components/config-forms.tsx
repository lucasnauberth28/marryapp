"use client";

import { useState } from "react";
import { Entrada } from "@/components/ui/input";
import { AvisoDoFormulario } from "@/components/ui/field";
import { Botao } from "@/components/ui/button";
import { estiloDoCartao } from "@/components/casal/ui";
import { cn } from "@/lib/utils";
import { centavosParaCampoDeReais } from "@/lib/platform/madrinha";
import { salvarLimitesContraAbusoDaMadrinha, salvarTetoGlobalDaMadrinha, salvarLimitesDaMadrinha } from "@/actions/madrinha/limites";
import { LinhaDeAlternancia } from "../../_sistema/toggle-row";
import { useAcaoDoAdmin } from "../../_sistema/use-admin-action";

interface LimitesDoPlano {
  perDay: number;
  perMonth: number;
  costCapCents: number;
  warnPercent: number;
  autoBlock: boolean;
}

interface EstadoDoPlano {
  perDay: string;
  perMonth: string;
  costCap: string;
  warnPercent: string;
  autoBlock: boolean;
}

const paraEstado = (l: LimitesDoPlano): EstadoDoPlano => ({
  perDay: String(l.perDay),
  perMonth: String(l.perMonth),
  costCap: centavosParaCampoDeReais(l.costCapCents),
  warnPercent: String(l.warnPercent),
  autoBlock: l.autoBlock,
});

function CartaoDoPlano({
  prefix,
  title,
  subtitle,
  state,
  onChange,
  errors,
}: {
  prefix: "subscription" | "trial";
  title: string;
  subtitle: string;
  state: EstadoDoPlano;
  onChange: (next: EstadoDoPlano) => void;
  errors: Record<string, string>;
}) {
  const set = <K extends keyof EstadoDoPlano>(key: K, value: EstadoDoPlano[K]) => onChange({ ...state, [key]: value });
  return (
    <div className={cn(estiloDoCartao, "flex flex-col gap-4 p-5")}>
      <div>
        <h3 className="text-lg font-semibold leading-6 text-tinta">{title}</h3>
        <p className="text-sm text-tinta-suave">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Entrada label="Mensagens por dia" inputMode="numeric" value={state.perDay} onChange={(e) => set("perDay", e.target.value)} error={errors[`${prefix}.perDay`]} />
        <Entrada label="Mensagens por mês" inputMode="numeric" value={state.perMonth} onChange={(e) => set("perMonth", e.target.value)} error={errors[`${prefix}.perMonth`]} />
        <Entrada label="Teto de custo por casal" prefix="R$" inputMode="decimal" value={state.costCap} onChange={(e) => set("costCap", e.target.value)} error={errors[`${prefix}.costCap`]} />
        <Entrada label="Avisar ao chegar em" suffix="%" inputMode="numeric" value={state.warnPercent} onChange={(e) => set("warnPercent", e.target.value)} error={errors[`${prefix}.warnPercent`]} />
      </div>
      <LinhaDeAlternancia
        label="Bloquear sozinha ao atingir o teto"
        description="O casal vê um aviso gentil e volta no mês seguinte."
        checked={state.autoBlock}
        onCheckedChange={(v) => set("autoBlock", v)}
        className="border-t border-linha pt-4"
      />
    </div>
  );
}

/** Limites por tipo de assinatura (salvos de verdade, valem quando a Liz for ativada). */
export function FormularioDeLimites({ subscription, trial }: { subscription: LimitesDoPlano; trial: LimitesDoPlano }) {
  const [sub, setSub] = useState(() => paraEstado(subscription));
  const [tri, setTri] = useState(() => paraEstado(trial));
  const { pending, errors, formError, run } = useAcaoDoAdmin();
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => salvarLimitesDaMadrinha({ subscription: sub, trial: tri }));
      }}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CartaoDoPlano prefix="subscription" title="Assinatura" subtitle="Casais com a Liz contratada" state={sub} onChange={setSub} errors={errors} />
        <CartaoDoPlano prefix="trial" title="Teste" subtitle="Período de teste, se o produto oferecer" state={tri} onChange={setTri} errors={errors} />
      </div>
      {formError && <AvisoDoFormulario>{formError}</AvisoDoFormulario>}
      <div>
        <Botao type="submit" loading={pending}>
          Salvar limites
        </Botao>
      </div>
    </form>
  );
}

export function FormularioDoTetoGlobal({ monthlyCostCapCents, warnPercent, pauseAtCap }: { monthlyCostCapCents: number; warnPercent: number; pauseAtCap: boolean }) {
  const [cap, setCap] = useState(centavosParaCampoDeReais(monthlyCostCapCents));
  const [warn, setWarn] = useState(String(warnPercent));
  const [pause, setPause] = useState(pauseAtCap);
  const { pending, errors, formError, run } = useAcaoDoAdmin();
  return (
    <form
      className="flex flex-1 flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => salvarTetoGlobalDaMadrinha({ monthlyCostCap: cap, warnPercent: warn, pauseAtCap: pause }));
      }}
    >
      <Entrada label="Custo máximo da Liz por mês" prefix="R$" inputMode="decimal" value={cap} onChange={(e) => setCap(e.target.value)} error={errors.monthlyCostCap} />
      <Entrada label="Avisar ao chegar em" suffix="%" inputMode="numeric" value={warn} onChange={(e) => setWarn(e.target.value)} error={errors.warnPercent} />
      <LinhaDeAlternancia label="Pausar tudo ao chegar no teto" description="Evita surpresa na fatura da API." checked={pause} onCheckedChange={setPause} />
      <p className="text-sm leading-5 text-tinta-suave">Ao chegar no aviso, a equipe receberá um e-mail. O envio só começa quando a Liz for ativada.</p>
      {formError && <AvisoDoFormulario>{formError}</AvisoDoFormulario>}
      <div className="mt-auto">
        <Botao type="submit" variant="outline" loading={pending}>
          Salvar teto
        </Botao>
      </div>
    </form>
  );
}

export function FormularioContraAbuso({ perHour, blockHours, blockOffTopic, offTopicBeforeBlock }: { perHour: number; blockHours: number; blockOffTopic: boolean; offTopicBeforeBlock: number }) {
  const [hour, setHour] = useState(String(perHour));
  const [hours, setHours] = useState(String(blockHours));
  const [off, setOff] = useState(blockOffTopic);
  const [before, setBefore] = useState(String(offTopicBeforeBlock));
  const { pending, errors, formError, run } = useAcaoDoAdmin();
  return (
    <form
      className="flex flex-1 flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => salvarLimitesContraAbusoDaMadrinha({ perHour: hour, blockHours: hours, blockOffTopic: off, offTopicBeforeBlock: before }));
      }}
    >
      <Entrada label="Mensagens por hora" inputMode="numeric" value={hour} onChange={(e) => setHour(e.target.value)} error={errors.perHour} />
      <Entrada label="Bloquear por (horas)" inputMode="numeric" value={hours} onChange={(e) => setHours(e.target.value)} error={errors.blockHours} />
      <LinhaDeAlternancia label="Bloquear quem usa como chat comum" description="Depois de algumas recusas por fuga de tema em um dia." checked={off} onCheckedChange={setOff} />
      {off && <Entrada label="Recusas antes de bloquear" inputMode="numeric" value={before} onChange={(e) => setBefore(e.target.value)} error={errors.offTopicBeforeBlock} />}
      <p className="text-sm leading-5 text-tinta-suave">Quem for bloqueado verá uma mensagem gentil e pode pedir ajuda ao suporte.</p>
      {formError && <AvisoDoFormulario>{formError}</AvisoDoFormulario>}
      <div className="mt-auto">
        <Botao type="submit" variant="outline" loading={pending}>
          Salvar bloqueio
        </Botao>
      </div>
    </form>
  );
}

