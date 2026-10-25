"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, TicketPercent } from "lucide-react";
import { criarCupom, excluirCupom, atualizarCupom, type CamposDoCupom } from "@/actions/coupon-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { formatarReais } from "@/lib/formatacao/dinheiro";
export interface LinhaDeCupom {
  id: string;
  code: string;
  percentOff: number | null;
  amountOff: number | null;
  planIds: string[];
  maxRedemptions: number | null;
  redemptions: number;
  /** "2026-12-31" (dia de Brasília) ou null. */
  expiresOn: string | null;
  /** Já formatado ("31 dez 2026"). */
  expiresLabel: string | null;
  expired: boolean;
  active: boolean;
}

interface EscolhaDePlano {
  id: string;
  label: string;
}

const ESTILO_DO_BOTAO =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";


/** "10,50" ou "10.50" -> 1050 centavos; null se não for um valor. */
function reaisParaCentavos(value: string): number | null {
  const clean = value.trim().replace(/\s|R\$/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(Number(clean) * 100);
}

function centavosParaReais(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function rotuloDoDesconto(c: Pick<LinhaDeCupom, "percentOff" | "amountOff">) {
  if (c.percentOff) return `${c.percentOff}% de desconto`;
  if (c.amountOff) return `${formatarReais(c.amountOff)} de desconto`;
  return "Sem desconto";
}

function situacaoDe(c: LinhaDeCupom): { label: string; tone: string } {
  if (!c.active) return { label: "Pausado", tone: "bg-areia text-tinta" };
  if (c.expired) return { label: "Vencido", tone: "bg-perigo-suave text-perigo" };
  if (c.maxRedemptions !== null && c.redemptions >= c.maxRedemptions) return { label: "Esgotado", tone: "bg-aviso-suave text-aviso" };
  return { label: "Valendo", tone: "bg-sucesso-suave text-sucesso" };
}

type RascunhoDoCupom = {
  code: string;
  kind: "percent" | "amount";
  value: string;
  planIds: string[];
  maxRedemptions: string;
  expiresAt: string;
  active: boolean;
};

const RASCUNHO_VAZIO_DO_CUPOM: RascunhoDoCupom = { code: "", kind: "percent", value: "", planIds: [], maxRedemptions: "", expiresAt: "", active: true };

function rascunhoDe(c: LinhaDeCupom): RascunhoDoCupom {
  return {
    code: c.code,
    kind: c.percentOff ? "percent" : "amount",
    value: c.percentOff ? String(c.percentOff) : c.amountOff ? centavosParaReais(c.amountOff) : "",
    planIds: c.planIds,
    maxRedemptions: c.maxRedemptions ? String(c.maxRedemptions) : "",
    expiresAt: c.expiresOn ?? "",
    active: c.active,
  };
}

export function SecaoDeCupons({ coupons, plans }: { coupons: LinhaDeCupom[]; plans: EscolhaDePlano[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<RascunhoDoCupom>(RASCUNHO_VAZIO_DO_CUPOM);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const planLabel = (id: string) => plans.find((p) => p.id === id)?.label ?? id;

  const open = (target: LinhaDeCupom | "new") => {
    setError("");
    setDeleting(null);
    if (target === "new") {
      setDraft(RASCUNHO_VAZIO_DO_CUPOM);
      setEditing("new");
    } else {
      setDraft(rascunhoDe(target));
      setEditing(target.id);
    }
  };

  const save = () => {
    setError("");
    const value = draft.kind === "percent" ? Number(draft.value) : reaisParaCentavos(draft.value);
    if (!value || !Number.isFinite(value) || value <= 0) {
      setError(draft.kind === "percent" ? "Informe o percentual de 1 a 100." : "Informe o valor do desconto, por exemplo 20,00.");
      return;
    }
    const fields: CamposDoCupom = {
      kind: draft.kind,
      value,
      planIds: draft.planIds as CamposDoCupom["planIds"],
      maxRedemptions: draft.maxRedemptions.trim() ? Number(draft.maxRedemptions) : null,
      expiresAt: draft.expiresAt || null,
      active: draft.active,
    };
    startTransition(async () => {
      const res = editing === "new" ? await criarCupom({ code: draft.code, ...fields }) : await atualizarCupom(editing ?? "", fields);
      if (res.success) {
        toast.success(editing === "new" ? `Cupom ${draft.code.trim().toUpperCase()} criado.` : "Cupom atualizado.");
        setEditing(null);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  const remove = (c: LinhaDeCupom) =>
    startTransition(async () => {
      const res = await excluirCupom(c.id);
      if (res.success) {
        toast.success(`Cupom ${c.code} excluído.`);
        setDeleting(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });

  const togglePlan = (id: string) =>
    setDraft((d) => ({ ...d, planIds: d.planIds.includes(id) ? d.planIds.filter((p) => p !== id) : [...d.planIds, id] }));

  const actions = (c: LinhaDeCupom) => (
    <>
      {deleting === c.id ? (
        <span role="group" aria-label={`Confirmar exclusão do cupom ${c.code}`} className="inline-flex items-center gap-1">
          <Button type="button" size="sm" onClick={() => remove(c)} loading={isPending} className="bg-perigo text-on-ameixa hover:bg-perigo/90">
            Excluir
          </Button>
          <Button type="button" variant="quiet" size="sm" onClick={() => setDeleting(null)} disabled={isPending}>
            Voltar
          </Button>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1">
          <button type="button" onClick={() => open(c)} className={cn(ESTILO_DO_BOTAO, "px-3 text-sm text-ameixa hover:bg-ameixa-suave")}>
            Editar<span className="sr-only"> o cupom {c.code}</span>
          </button>
          <button
            type="button"
            onClick={() => setDeleting(c.id)}
            className={cn(ESTILO_DO_BOTAO, "px-3 text-sm text-tinta-suave hover:bg-perigo-suave hover:text-perigo")}
          >
            Excluir<span className="sr-only"> o cupom {c.code}</span>
          </button>
        </span>
      )}
    </>
  );

  return (
    <section aria-labelledby="cupons-titulo" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 id="cupons-titulo" className="text-xl font-semibold text-tinta">
            Cupons
          </h2>
          <p className="text-sm text-tinta-suave">O uso só conta quando o Pix é confirmado. Nenhuma cobrança fica abaixo de R$ 1,00.</p>
        </div>
        {editing === null ? (
          <button type="button" onClick={() => open("new")} className={cn(ESTILO_DO_BOTAO, "bg-ameixa text-on-ameixa hover:bg-ameixa-hover")}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo cupom
          </button>
        ) : null}
      </div>

      {editing !== null ? (
        <form
          aria-label={editing === "new" ? "Novo cupom" : `Editar cupom ${draft.code}`}
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="flex flex-col gap-5 rounded-2xl border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-1)] sm:p-6"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              id="cupom-codigo"
              label="Código"
              hint={editing === "new" ? "Letras e números, sem espaços." : "O código não muda depois de criado."}
              value={draft.code}
              onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
              disabled={editing !== "new"}
              required
              minLength={3}
              maxLength={30}
              autoCapitalize="characters"
              placeholder="NOIVOS10"
              inputClassName="font-mono uppercase"
            />

            <div className="flex gap-3">
              <NativeSelect
                id="cupom-tipo"
                label="Tipo de desconto"
                fieldClassName="w-44 shrink-0"
                value={draft.kind}
                onChange={(e) => setDraft({ ...draft, kind: e.target.value as RascunhoDoCupom["kind"], value: "" })}
              >
                <option value="percent">Percentual (%)</option>
                <option value="amount">Valor fixo (R$)</option>
              </NativeSelect>
              <Input
                id="cupom-valor"
                label={draft.kind === "percent" ? "Percentual" : "Valor"}
                {...(draft.kind === "percent" ? { suffix: "%" } : { prefix: "R$" })}
                fieldClassName="min-w-0 flex-1"
                inputMode={draft.kind === "percent" ? "numeric" : "decimal"}
                value={draft.value}
                onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                required
                placeholder={draft.kind === "percent" ? "10" : "20,00"}
                inputClassName="tabular-nums"
              />
            </div>

            <Input
              id="cupom-limite"
              label="Limite de usos"
              type="number"
              min={1}
              inputMode="numeric"
              value={draft.maxRedemptions}
              onChange={(e) => setDraft({ ...draft, maxRedemptions: e.target.value })}
              placeholder="Sem limite"
              inputClassName="tabular-nums"
            />

            <Input
              id="cupom-validade"
              label="Vale até"
              type="date"
              hint="Em branco, não vence. Vale até o fim do dia."
              value={draft.expiresAt}
              onChange={(e) => setDraft({ ...draft, expiresAt: e.target.value })}
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold text-tinta">Planos</legend>
            <p className="text-[13px] text-tinta-suave">Nenhum marcado: vale para todos os planos pagos.</p>
            <div className="flex flex-wrap gap-2">
              {plans.map((p) => {
                const checked = draft.planIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={cn(
                      "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ameixa",
                      checked ? "border-ameixa bg-ameixa-suave text-ameixa" : "border-linha bg-papel text-tinta hover:border-linha-forte",
                    )}
                  >
                    <input type="checkbox" checked={checked} onChange={() => togglePlan(p.id)} className="h-4 w-4 accent-ameixa" />
                    {p.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] text-tinta">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
              className="h-5 w-5 cursor-pointer accent-ameixa"
            />
            Cupom valendo (desmarque para pausar sem excluir)
          </label>

          {error ? (
            <p role="alert" className="rounded-xl bg-perigo-suave p-3 text-sm font-semibold text-perigo">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={isPending}>
              {editing === "new" ? "Criar cupom" : "Salvar"}
            </Button>
            <Button type="button" variant="quiet" onClick={() => setEditing(null)} disabled={isPending}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      {coupons.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-linha bg-linho p-5 text-[15px] text-tinta-suave">
          <TicketPercent className="h-5 w-5 shrink-0" aria-hidden="true" />
          Nenhum cupom ainda. Crie um para oferecer desconto no Pix dos planos.
        </div>
      ) : (
        <div className="hidden overflow-x-auto rounded-2xl border border-linha bg-papel md:block">
          <table className="w-full min-w-[760px] border-collapse text-[15px]">
            <caption className="sr-only">Cupons de desconto</caption>
            <thead>
              <tr className="text-left text-[13px] text-tinta-suave">
                <th scope="col" className="px-4 py-3 font-semibold">Código</th>
                <th scope="col" className="px-4 py-3 font-semibold">Desconto</th>
                <th scope="col" className="px-4 py-3 font-semibold">Planos</th>
                <th scope="col" className="px-4 py-3 font-semibold">Usos</th>
                <th scope="col" className="px-4 py-3 font-semibold">Validade</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const status = situacaoDe(c);
                return (
                  <tr key={c.id} className={cn("border-t border-linha", editing === c.id && "bg-ameixa-suave")}>
                    <td className="px-4 py-3.5 font-mono font-semibold text-tinta">{c.code}</td>
                    <td className="px-4 py-3.5 text-tinta">{rotuloDoDesconto(c)}</td>
                    <td className="px-4 py-3.5 text-sm text-tinta-suave">
                      {c.planIds.length === 0 ? "Todos" : c.planIds.map(planLabel).join(", ")}
                    </td>
                    <td className="px-4 py-3.5 tabular-nums text-tinta">
                      {c.redemptions}
                      {c.maxRedemptions !== null ? ` de ${c.maxRedemptions}` : ""}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-tinta-suave">{c.expiresLabel ?? "Não vence"}</td>
                    <td className="px-4 py-3.5">
                      <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[13px] font-semibold leading-4", status.tone)}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      {actions(c)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {coupons.length > 0 ? (
        <ul className="flex flex-col gap-3 md:hidden" aria-label="Cupons de desconto">
          {coupons.map((c) => {
            const status = situacaoDe(c);
            return (
              <li key={c.id} className={cn("flex flex-col gap-2 rounded-2xl border border-linha bg-papel p-4", editing === c.id && "bg-ameixa-suave")}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="font-mono text-tinta">{c.code}</strong>
                  <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[13px] font-semibold leading-4", status.tone)}>{status.label}</span>
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                  <dt className="text-tinta-suave">Desconto</dt>
                  <dd className="text-tinta">{rotuloDoDesconto(c)}</dd>
                  <dt className="text-tinta-suave">Planos</dt>
                  <dd className="text-tinta">{c.planIds.length === 0 ? "Todos" : c.planIds.map(planLabel).join(", ")}</dd>
                  <dt className="text-tinta-suave">Usos</dt>
                  <dd className="text-tinta">
                    {c.redemptions}
                    {c.maxRedemptions !== null ? ` de ${c.maxRedemptions}` : ""}
                  </dd>
                  <dt className="text-tinta-suave">Validade</dt>
                  <dd className="text-tinta">{c.expiresLabel ?? "Não vence"}</dd>
                </dl>
                <div className="-ml-3 flex flex-wrap">{actions(c)}</div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
