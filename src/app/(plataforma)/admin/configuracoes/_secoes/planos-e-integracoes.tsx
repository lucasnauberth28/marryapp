import { CheckCircle2, MinusCircle } from "lucide-react";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { INTEGRACOES, situacaoDaIntegracao } from "@/lib/platform/config-core";
import { MODULOS_DO_CASAL } from "@/lib/pricing-modules";
import { modulosDoPlano } from "@/lib/wedding-plan-modules";
import { SecaoDaConfiguracao } from "./secao";

const COLUNAS_DE_PLANO = [
  { id: "basic", label: "Básico", modules: [] as string[] },
  { id: "classic", label: "Classic", modules: modulosDoPlano("classic") },
  { id: "vip", label: "VIP", modules: modulosDoPlano("vip") },
];

function CelulaDeRecurso({ inclui }: { inclui: boolean }) {
  return inclui ? (
    <span className="inline-flex items-center gap-1 font-semibold text-sucesso"><CheckCircle2 className="size-4" aria-hidden="true" />Inclui</span>
  ) : (
    <span className="inline-flex items-center gap-1 text-tinta-suave"><MinusCircle className="size-4" aria-hidden="true" />Não inclui</span>
  );
}

export function SecaoDosRecursosPorPlano() {
  return (
    <SecaoDaConfiguracao id="planos" title="Recursos por plano" description="Só leitura: o que cada plano libera é regra do código, não configuração.">
      <div className="overflow-x-auto rounded-2xl border border-linha">
        <table className="w-full min-w-[480px] border-collapse text-left text-[15px]">
          <caption className="sr-only">Recursos liberados por plano de casal</caption>
          <thead>
            <tr className="border-b border-linha text-[13px] text-tinta-suave">
              <th scope="col" className="px-4 py-3 font-semibold">Recurso</th>
              {COLUNAS_DE_PLANO.map((p) => (
                <th key={p.id} scope="col" className="px-4 py-3 text-center font-semibold">{p.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULOS_DO_CASAL.map((m) => (
              <tr key={m.id} className="border-b border-linha last:border-b-0">
                <th scope="row" className="px-4 py-3 font-normal text-tinta">{m.name}</th>
                {COLUNAS_DE_PLANO.map((p) => (
                  <td key={p.id} className="px-4 py-3 text-center">
                    <CelulaDeRecurso inclui={p.modules.includes(m.id)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm leading-5 text-tinta-suave">O plano adaptado vale pelos recursos que o casal escolhe. Hoje o servidor só bloqueia WhatsApp, check-in com QR Code e domínio próprio; os outros estão liberados para todos.</p>
    </SecaoDaConfiguracao>
  );
}

const LINHA_DA_INTEGRACAO = "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3";

export function SecaoDasIntegracoes() {
  const integrations = INTEGRACOES.map((def) => situacaoDaIntegracao(def, process.env));
  return (
    <SecaoDaConfiguracao id="integracoes" title="Integrações" description="Só mostra se a variável está preenchida no servidor. Nenhuma chave é exibida ou gravada aqui.">
      <ul className="divide-y divide-linha overflow-hidden rounded-2xl border border-linha">
        {integrations.map((i) => (
          <li key={i.id} className={LINHA_DA_INTEGRACAO}>
            <span className="text-[15px] font-semibold text-tinta">{i.name}</span>
            <span className="flex items-center gap-3">
              {i.tail && <span className="font-mono text-sm text-tinta-suave">••••{i.tail}</span>}
              {i.connected ? <EtiquetaDeSituacao tone="sucesso" icon={CheckCircle2}>Conectado</EtiquetaDeSituacao> : <EtiquetaDeSituacao tone="neutro" icon={MinusCircle}>Não configurado</EtiquetaDeSituacao>}
            </span>
          </li>
        ))}
        <li className={LINHA_DA_INTEGRACAO}>
          <span className="text-[15px] font-semibold text-tinta">API da Liz</span>
          <EtiquetaDeSituacao tone="neutro" icon={MinusCircle}>Ainda não conectada</EtiquetaDeSituacao>
        </li>
      </ul>
      <p className="mt-3 text-sm leading-5 text-tinta-suave">Para trocar ou conectar uma chave, configure na Vercel (variáveis de ambiente) e faça um novo deploy.</p>
    </SecaoDaConfiguracao>
  );
}
