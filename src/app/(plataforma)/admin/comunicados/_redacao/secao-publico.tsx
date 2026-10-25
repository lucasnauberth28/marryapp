import { Esqueleto } from "@/components/ui/skeleton";
import { SelecaoNativa } from "@/components/ui/select";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { GRUPOS_DE_PLANO_DO_CASAL, GRUPOS_DE_PLANO_DO_FORNECEDOR, JANELAS_DE_CASAMENTO, ROTULO_DA_JANELA, ROTULO_DO_GRUPO_DE_PLANO, type Publico } from "@/lib/platform/announcement";
import { formatarInteiro } from "@/lib/platform/format";
import { pluralizar } from "@/lib/formatacao/plural";
import { cn } from "@/lib/utils";
import type { PrevisaoDoPublico } from "@/lib/platform/queries/comunicados";
import type { RedacaoDoComunicado } from "./use-redacao";

function textoDoPublico(audience: Publico, preview: PrevisaoDoPublico) {
  if (audience.kind === "couples") return `${pluralizar(preview.couples.matched, "casal", "casais")} de ${formatarInteiro(preview.couples.total)}`;
  if (audience.kind === "vendors") return `${pluralizar(preview.vendors.matched, "fornecedor", "fornecedores")} de ${formatarInteiro(preview.vendors.total)}`;
  return `${pluralizar(preview.couples.matched, "casal", "casais")} e ${pluralizar(preview.vendors.matched, "fornecedor", "fornecedores")}`;
}

function ResumoDoPublico({ audience, preview, previewing }: { audience: Publico; preview: PrevisaoDoPublico | null; previewing: boolean }) {
  return (
    <p aria-busy={previewing || undefined} className={cn("flex min-h-7 flex-wrap items-center gap-2 text-sm leading-5 text-tinta-suave transition-opacity", previewing && "opacity-60")} aria-live="polite">
      {preview ? (
        <>
          <EtiquetaDeSituacao tone={preview.people === 0 || preview.tooMany ? "aviso" : "salvia"}>Chega a {textoDoPublico(audience, preview)}</EtiquetaDeSituacao>
          <span>{preview.tooMany ? "Passa do limite de 5.000 pessoas por envio." : `${pluralizar(preview.people, "pessoa", "pessoas")} com conta.`}</span>
        </>
      ) : (
        <>
          <span className="sr-only">Calculando o público...</span>
          <Esqueleto className="h-7 w-44 rounded-lg" />
          <Esqueleto className="h-4 w-32 rounded-md" />
        </>
      )}
    </p>
  );
}

function SelecoesDoPublico({ r }: { r: RedacaoDoComunicado }) {
  const { audience, onlyChosen, changeAudience } = r;
  const planOptions = audience.kind === "vendors" ? GRUPOS_DE_PLANO_DO_FORNECEDOR : GRUPOS_DE_PLANO_DO_CASAL;
  const planValue = audience.kind === "vendors" ? audience.vendorPlans : audience.couplePlans;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <SelecaoNativa label="Público" value={audience.kind} disabled={onlyChosen} onChange={(e) => changeAudience({ kind: e.target.value as Publico["kind"] })}>
        <option value="couples">Casais</option>
        <option value="vendors">Fornecedores</option>
        <option value="all">Casais e fornecedores</option>
      </SelecaoNativa>
      <SelecaoNativa
        label="Plano"
        alwaysFloat
        value={planValue}
        disabled={audience.kind === "all"}
        hint={audience.kind === "all" ? "Vale ao escolher um público" : undefined}
        onChange={(e) => changeAudience(audience.kind === "vendors" ? { vendorPlans: e.target.value as Publico["vendorPlans"] } : { couplePlans: e.target.value as Publico["couplePlans"] })}
      >
        {planOptions.map((p) => (
          <option key={p} value={p}>
            {ROTULO_DO_GRUPO_DE_PLANO[p]}
          </option>
        ))}
      </SelecaoNativa>
      <SelecaoNativa
        label="Data do casamento"
        alwaysFloat
        value={audience.weddingWindow}
        disabled={audience.kind === "vendors"}
        hint={audience.kind === "vendors" ? "Só para casais" : undefined}
        onChange={(e) => changeAudience({ weddingWindow: e.target.value as Publico["weddingWindow"] })}
      >
        {JANELAS_DE_CASAMENTO.map((w) => (
          <option key={w} value={w}>
            {ROTULO_DA_JANELA[w]}
          </option>
        ))}
      </SelecaoNativa>
    </div>
  );
}

export function SecaoPublico({ r }: { r: RedacaoDoComunicado }) {
  const { audience, onlyChosen, changeAudience } = r;
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-base font-semibold text-tinta">Para quem</legend>
      {onlyChosen && (
        <p className="rounded-xl bg-ameixa-suave px-3 py-2 text-sm leading-5 text-tinta">
          Só para os {audience.weddingIds?.length} casais escolhidos em Casais.{" "}
          <button type="button" className="font-semibold text-ameixa underline underline-offset-2" onClick={() => changeAudience({ weddingIds: undefined })}>
            Tirar essa restrição
          </button>
        </p>
      )}
      <SelecoesDoPublico r={r} />
      <SelecaoNativa
        label="Tipo de aviso"
        alwaysFloat
        value={audience.service ? "service" : "news"}
        onChange={(e) => changeAudience({ service: e.target.value === "service" })}
        hint={audience.service ? "Aviso do serviço (manutenção, cobrança, segurança): chega mesmo para quem desligou os e-mails." : "Novidade: só chega a quem aceitou receber esse tipo de aviso."}
      >
        <option value="news">Novidade</option>
        <option value="service">Aviso do serviço</option>
      </SelecaoNativa>
      <ResumoDoPublico audience={audience} preview={r.preview} previewing={r.previewing} />
    </fieldset>
  );
}
