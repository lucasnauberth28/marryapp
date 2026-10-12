"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { FormAlert } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { card } from "@/components/casal/ui";
import { cn } from "@/lib/utils";
import { centsToReaisInput } from "@/lib/platform/madrinha";
import { saveMadrinhaAbuse, saveMadrinhaGlobalCap, saveMadrinhaLimits } from "@/actions/admin-madrinha-actions";
import { ToggleRow } from "../../_sistema/toggle-row";
import { useAdminAction } from "../../_sistema/use-admin-action";

interface PlanLimits {
  perDay: number;
  perMonth: number;
  costCapCents: number;
  warnPercent: number;
  autoBlock: boolean;
}

interface PlanState {
  perDay: string;
  perMonth: string;
  costCap: string;
  warnPercent: string;
  autoBlock: boolean;
}

const toState = (l: PlanLimits): PlanState => ({
  perDay: String(l.perDay),
  perMonth: String(l.perMonth),
  costCap: centsToReaisInput(l.costCapCents),
  warnPercent: String(l.warnPercent),
  autoBlock: l.autoBlock,
});

function PlanCard({
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
  state: PlanState;
  onChange: (next: PlanState) => void;
  errors: Record<string, string>;
}) {
  const set = <K extends keyof PlanState>(key: K, value: PlanState[K]) => onChange({ ...state, [key]: value });
  return (
    <div className={cn(card, "flex flex-col gap-4 p-5")}>
      <div>
        <h3 className="text-lg font-semibold leading-6 text-tinta">{title}</h3>
        <p className="text-sm text-tinta-suave">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Mensagens por dia" inputMode="numeric" value={state.perDay} onChange={(e) => set("perDay", e.target.value)} error={errors[`${prefix}.perDay`]} />
        <Input label="Mensagens por mês" inputMode="numeric" value={state.perMonth} onChange={(e) => set("perMonth", e.target.value)} error={errors[`${prefix}.perMonth`]} />
        <Input label="Teto de custo por casal" prefix="R$" inputMode="decimal" value={state.costCap} onChange={(e) => set("costCap", e.target.value)} error={errors[`${prefix}.costCap`]} />
        <Input label="Avisar ao chegar em" suffix="%" inputMode="numeric" value={state.warnPercent} onChange={(e) => set("warnPercent", e.target.value)} error={errors[`${prefix}.warnPercent`]} />
      </div>
      <ToggleRow
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
export function LimitsForm({ subscription, trial }: { subscription: PlanLimits; trial: PlanLimits }) {
  const [sub, setSub] = useState(() => toState(subscription));
  const [tri, setTri] = useState(() => toState(trial));
  const { pending, errors, formError, run } = useAdminAction();
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveMadrinhaLimits({ subscription: sub, trial: tri }));
      }}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PlanCard prefix="subscription" title="Assinatura" subtitle="Casais com a Liz contratada" state={sub} onChange={setSub} errors={errors} />
        <PlanCard prefix="trial" title="Teste" subtitle="Período de teste, se o produto oferecer" state={tri} onChange={setTri} errors={errors} />
      </div>
      {formError && <FormAlert>{formError}</FormAlert>}
      <div>
        <Button type="submit" loading={pending}>
          Salvar limites
        </Button>
      </div>
    </form>
  );
}

export function GlobalCapForm({ monthlyCostCapCents, warnPercent, pauseAtCap }: { monthlyCostCapCents: number; warnPercent: number; pauseAtCap: boolean }) {
  const [cap, setCap] = useState(centsToReaisInput(monthlyCostCapCents));
  const [warn, setWarn] = useState(String(warnPercent));
  const [pause, setPause] = useState(pauseAtCap);
  const { pending, errors, formError, run } = useAdminAction();
  return (
    <form
      className="flex flex-1 flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveMadrinhaGlobalCap({ monthlyCostCap: cap, warnPercent: warn, pauseAtCap: pause }));
      }}
    >
      <Input label="Custo máximo da Liz por mês" prefix="R$" inputMode="decimal" value={cap} onChange={(e) => setCap(e.target.value)} error={errors.monthlyCostCap} />
      <Input label="Avisar ao chegar em" suffix="%" inputMode="numeric" value={warn} onChange={(e) => setWarn(e.target.value)} error={errors.warnPercent} />
      <ToggleRow label="Pausar tudo ao chegar no teto" description="Evita surpresa na fatura da API." checked={pause} onCheckedChange={setPause} />
      <p className="text-sm leading-5 text-tinta-suave">Ao chegar no aviso, a equipe receberá um e-mail. O envio só começa quando a Liz for ativada.</p>
      {formError && <FormAlert>{formError}</FormAlert>}
      <div className="mt-auto">
        <Button type="submit" variant="outline" loading={pending}>
          Salvar teto
        </Button>
      </div>
    </form>
  );
}

export function AbuseForm({ perHour, blockHours, blockOffTopic, offTopicBeforeBlock }: { perHour: number; blockHours: number; blockOffTopic: boolean; offTopicBeforeBlock: number }) {
  const [hour, setHour] = useState(String(perHour));
  const [hours, setHours] = useState(String(blockHours));
  const [off, setOff] = useState(blockOffTopic);
  const [before, setBefore] = useState(String(offTopicBeforeBlock));
  const { pending, errors, formError, run } = useAdminAction();
  return (
    <form
      className="flex flex-1 flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveMadrinhaAbuse({ perHour: hour, blockHours: hours, blockOffTopic: off, offTopicBeforeBlock: before }));
      }}
    >
      <Input label="Mensagens por hora" inputMode="numeric" value={hour} onChange={(e) => setHour(e.target.value)} error={errors.perHour} />
      <Input label="Bloquear por (horas)" inputMode="numeric" value={hours} onChange={(e) => setHours(e.target.value)} error={errors.blockHours} />
      <ToggleRow label="Bloquear quem usa como chat comum" description="Depois de algumas recusas por fuga de tema em um dia." checked={off} onCheckedChange={setOff} />
      {off && <Input label="Recusas antes de bloquear" inputMode="numeric" value={before} onChange={(e) => setBefore(e.target.value)} error={errors.offTopicBeforeBlock} />}
      <p className="text-sm leading-5 text-tinta-suave">Quem for bloqueado verá uma mensagem gentil e pode pedir ajuda ao suporte.</p>
      {formError && <FormAlert>{formError}</FormAlert>}
      <div className="mt-auto">
        <Button type="submit" variant="outline" loading={pending}>
          Salvar bloqueio
        </Button>
      </div>
    </form>
  );
}

