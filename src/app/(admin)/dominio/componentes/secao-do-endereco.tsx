import { useMemo } from "react";
import { estiloDoCartao, estiloDoTituloDoCartao } from "@/components/casal/ui";
import { Entrada } from "@/components/ui/input";
import { SUFIXO_DO_DOMINIO, normalizarNomeDeDominio, sugerirNomesDeDominio } from "@/lib/domain-name";
import { cn } from "@/lib/utils";
import { ResultadoDaConferencia } from "./resultado-da-conferencia";
import type { PedidoDeDominio } from "./use-pedido-de-dominio";

function Sugestoes({ sugestoes, aoEscolher }: { sugestoes: string[]; aoEscolher: (dominio: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <p id="dominio-sugestoes" className="text-sm font-semibold text-tinta">
        Ideias para vocês
      </p>
      <ul aria-labelledby="dominio-sugestoes" className="flex flex-wrap gap-2">
        {sugestoes.map((domain) => (
          <li key={domain}>
            <button
              type="button"
              onClick={() => aoEscolher(domain)}
              className="inline-flex min-h-11 items-center rounded-xl border border-linha-forte bg-papel px-4 text-[15px] font-semibold text-tinta transition-colors hover:border-ameixa hover:bg-ameixa-suave focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ameixa"
            >
              {domain}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SecaoDoEndereco({ pedido, coupleNames, weddingDate }: { pedido: PedidoDeDominio; coupleNames: string; weddingDate: string | null }) {
  const { dados, errors } = pedido;
  const sugestoes = useMemo(() => sugerirNomesDeDominio({ coupleNames, weddingDate: weddingDate ? new Date(weddingDate) : null }, { max: 5 }), [coupleNames, weddingDate]);
  const nomeInterpretado = normalizarNomeDeDominio(dados.name);
  return (
    <section aria-labelledby="dominio-endereco" className={cn(estiloDoCartao, "flex flex-col gap-4 p-5 sm:p-6")}>
      <div className="flex flex-col gap-1">
        <h2 id="dominio-endereco" className={estiloDoTituloDoCartao}>
          Qual endereço vocês querem?
        </h2>
        <p className="text-[15px] text-tinta-suave">Hoje registramos endereços terminados em {SUFIXO_DO_DOMINIO}.</p>
      </div>
      <Entrada
        id="dominio-nome"
        label="Nome do endereço"
        suffix={SUFIXO_DO_DOMINIO}
        hint="Só letras, números e hífen. Pode digitar do seu jeito, nós arrumamos."
        error={errors.domain}
        value={dados.name}
        onChange={(e) => pedido.mudarNome(e.target.value)}
        placeholder="anaerafael"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        inputMode="url"
      />
      {nomeInterpretado.ok && dados.name.trim() && nomeInterpretado.label !== dados.name.trim().toLowerCase() ? (
        <p className="text-sm text-tinta-suave">
          Vai ficar assim: <strong className="font-semibold text-tinta">{nomeInterpretado.domain}</strong>
        </p>
      ) : null}
      <ResultadoDaConferencia check={pedido.check} />
      {sugestoes.length > 0 ? <Sugestoes sugestoes={sugestoes} aoEscolher={pedido.escolher} /> : null}
    </section>
  );
}
