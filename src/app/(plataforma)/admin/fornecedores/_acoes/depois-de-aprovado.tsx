import { useState } from "react";
import { concederPlanoAoFornecedor, definirFornecedorEmDestaque } from "@/actions/admin-fornecedores-actions";
import { Botao } from "@/components/ui/button";
import { SelecaoNativa } from "@/components/ui/select";
import { Interruptor } from "@/components/ui/switch";
import { AreaDeTexto } from "@/components/ui/textarea";
import { DIAS_DE_CONCESSAO } from "@/lib/platform/vendor-admin";
import type { AcoesDoPainel } from "./tipos";

interface Propriedades {
  vendorId: string;
  featured: boolean;
  canFeature: boolean;
  acao: AcoesDoPainel;
}

function InterruptorDeDestaque({ vendorId, featured, canFeature, acao }: Propriedades) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={`destaque-${vendorId}`} className="block text-[15px] font-semibold text-tinta">
          Destacar na vitrine
        </label>
        <p className="text-sm text-tinta-suave">{canFeature ? "Aparece no topo da lista de fornecedores." : "Só quem está aprovado e ativo pode ser destacado."}</p>
      </div>
      <Interruptor
        id={`destaque-${vendorId}`}
        checked={featured}
        disabled={acao.pending || (!canFeature && !featured)}
        onCheckedChange={(checked) => acao.run("feature", () => definirFornecedorEmDestaque({ vendorId, featured: checked }))}
      />
    </div>
  );
}

function FormularioDeCortesia({ vendorId, acao }: Pick<Propriedades, "vendorId" | "acao">) {
  const [tier, setTier] = useState<"PRO" | "MASTER">("PRO");
  const [days, setDays] = useState("30");
  const [grantReason, setGrantReason] = useState("");
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        acao.run("grant", () => concederPlanoAoFornecedor({ vendorId, tier, days: Number(days), reason: grantReason }), () => setGrantReason(""));
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <SelecaoNativa label="Conceder plano" alwaysFloat value={tier} onChange={(e) => setTier(e.target.value as "PRO" | "MASTER")}>
          <option value="PRO">Pro</option>
          <option value="MASTER">Master</option>
        </SelecaoNativa>
        <SelecaoNativa label="Por quantos dias" alwaysFloat value={days} onChange={(e) => setDays(e.target.value)}>
          {DIAS_DE_CONCESSAO.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </SelecaoNativa>
      </div>
      <AreaDeTexto label="Motivo da cortesia" rows={2} maxLength={500} value={grantReason} onChange={(e) => setGrantReason(e.target.value)} hint="Fica no registro de atividades. Não gera cobrança." />
      <Botao type="submit" variant="outline" disabled={grantReason.trim().length < 5 || acao.pending} loading={acao.carregando("grant")} className="self-start">
        Conceder plano
      </Botao>
    </form>
  );
}

export function SecaoDepoisDeAprovado(props: Propriedades) {
  return (
    <section aria-label="Depois de aprovado" className="flex flex-col gap-4 border-t border-linha pt-4">
      <h3 className="text-[15px] font-semibold text-tinta">Depois de aprovado</h3>
      <InterruptorDeDestaque {...props} />
      <FormularioDeCortesia vendorId={props.vendorId} acao={props.acao} />
    </section>
  );
}
