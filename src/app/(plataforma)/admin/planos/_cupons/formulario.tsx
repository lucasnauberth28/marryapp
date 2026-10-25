import { Botao } from "@/components/ui/button";
import { Entrada } from "@/components/ui/input";
import { SelecaoNativa } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { EscolhaDePlano, RascunhoDoCupom } from "./tipos";
import type { EstadoDosCupons } from "./use-cupons";

function CamposDoDesconto({ draft, setDraft }: Pick<EstadoDosCupons, "draft" | "setDraft">) {
  return (
    <div className="flex gap-3">
      <SelecaoNativa id="cupom-tipo" label="Tipo de desconto" fieldClassName="w-44 shrink-0" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as RascunhoDoCupom["kind"], value: "" })}>
        <option value="percent">Percentual (%)</option>
        <option value="amount">Valor fixo (R$)</option>
      </SelecaoNativa>
      <Entrada
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
  );
}

function EscolhaDosPlanos({ plans, draft, aoAlternar }: { plans: EscolhaDePlano[]; draft: RascunhoDoCupom; aoAlternar: (id: string) => void }) {
  return (
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
              <input type="checkbox" checked={checked} onChange={() => aoAlternar(p.id)} className="h-4 w-4 accent-ameixa" />
              {p.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function RodapeDoFormulario({ estado }: { estado: EstadoDosCupons }) {
  const { editing, draft, setDraft, error, isPending, setEditing } = estado;
  return (
    <>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] text-tinta">
        <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} className="h-5 w-5 cursor-pointer accent-ameixa" />
        Cupom valendo (desmarque para pausar sem excluir)
      </label>

      {error ? (
        <p role="alert" className="rounded-xl bg-perigo-suave p-3 text-sm font-semibold text-perigo">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Botao type="submit" loading={isPending}>
          {editing === "new" ? "Criar cupom" : "Salvar"}
        </Botao>
        <Botao type="button" variant="quiet" onClick={() => setEditing(null)} disabled={isPending}>
          Cancelar
        </Botao>
      </div>
    </>
  );
}

export function FormularioDeCupom({ estado, plans }: { estado: EstadoDosCupons; plans: EscolhaDePlano[] }) {
  const { editing, draft, setDraft, save, togglePlan } = estado;
  return (
    <form
      aria-label={editing === "new" ? "Novo cupom" : `Editar cupom ${draft.code}`}
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="flex flex-col gap-5 rounded-2xl border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-1)] sm:p-6"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Entrada
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
        <CamposDoDesconto draft={draft} setDraft={setDraft} />
        <Entrada id="cupom-limite" label="Limite de usos" type="number" min={1} inputMode="numeric" value={draft.maxRedemptions} onChange={(e) => setDraft({ ...draft, maxRedemptions: e.target.value })} placeholder="Sem limite" inputClassName="tabular-nums" />
        <Entrada id="cupom-validade" label="Vale até" type="date" hint="Em branco, não vence. Vale até o fim do dia." value={draft.expiresAt} onChange={(e) => setDraft({ ...draft, expiresAt: e.target.value })} />
      </div>

      <EscolhaDosPlanos plans={plans} draft={draft} aoAlternar={togglePlan} />

      <RodapeDoFormulario estado={estado} />
    </form>
  );
}
