import { estiloDoCartao, estiloDoTituloDoCartao } from "@/components/casal/ui";
import { Entrada } from "@/components/ui/input";
import { formatarDocumento } from "@/lib/document-br";
import { cn } from "@/lib/utils";
import type { PedidoDeDominio } from "./use-pedido-de-dominio";

export function SecaoDoTitular({ pedido }: { pedido: PedidoDeDominio }) {
  const { dados, errors, mudar } = pedido;
  return (
    <section aria-labelledby="dominio-titular" className={cn(estiloDoCartao, "flex flex-col gap-4 p-5 sm:p-6")}>
      <div className="flex flex-col gap-1">
        <h2 id="dominio-titular" className={estiloDoTituloDoCartao}>
          Quem será o titular do endereço?
        </h2>
        <p className="text-[15px] text-tinta-suave">
          O endereço fica registrado no nome do titular (uma pessoa com CPF ou uma empresa com CNPJ). O Registro.br, que cuida dos endereços .com.br, pede esses dados.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Entrada id="dominio-titular-nome" label="Nome completo ou razão social" fieldClassName="sm:col-span-2" error={errors.holderName} value={dados.holderName} onChange={(e) => mudar("holderName", e.target.value)} autoComplete="name" />
        <Entrada
          id="dominio-titular-doc"
          label="CPF ou CNPJ"
          hint="Guardamos só até concluir o registro. Depois escondemos os números."
          error={errors.holderDocument}
          value={dados.holderDocument}
          onChange={(e) => mudar("holderDocument", e.target.value)}
          onBlur={() => mudar("holderDocument", formatarDocumento(dados.holderDocument))}
          autoComplete="off"
          inputMode="text"
        />
        <Entrada id="dominio-titular-tel" type="tel" label="Telefone com DDD" error={errors.holderPhone} value={dados.holderPhone} onChange={(e) => mudar("holderPhone", e.target.value)} autoComplete="tel" placeholder="(11) 91234-5678" />
        <Entrada id="dominio-titular-email" type="email" label="E-mail do titular" fieldClassName="sm:col-span-2" error={errors.holderEmail} value={dados.holderEmail} onChange={(e) => mudar("holderEmail", e.target.value)} autoComplete="email" />
      </div>
    </section>
  );
}
