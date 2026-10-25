import { Check, Clock } from "lucide-react";
import { Painel } from "@/components/plataforma/panel";
import { EtiquetaDePlano, EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { formatarDiaEMes, diaRelativo } from "@/lib/platform/format";
import { obterPlanosDeFornecedorPrestesAVencer } from "@/lib/platform/queries/fornecedores";

export async function BlocoDeVencimentos({ now }: { now: Date }) {
  const expiring = await obterPlanosDeFornecedorPrestesAVencer(now, 7, 5);
  return (
    <Painel title="Planos de fornecedores vencendo" action={{ label: "Ver todos", href: "/admin/fornecedores?aba=vencendo" }}>
      {expiring.length === 0 ? (
        <p className="text-tinta-suave">Nenhum plano pago vence nos próximos 7 dias.</p>
      ) : (
        <ul className="flex flex-col">
          {expiring.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-linha py-3 first:pt-0 last:border-b-0 last:pb-0">
              <span>
                <span className="block font-semibold text-tinta">{v.companyName}</span>
                <span className="block text-sm text-tinta-suave">
                  {diaRelativo(v.planExpiresAt, now)}, {formatarDiaEMes(v.planExpiresAt)}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <EtiquetaDePlano plan={v.planTier} />
                {v.reminderSent ? (
                  <EtiquetaDeSituacao tone="neutro" icon={Check}>
                    Aviso enviado
                  </EtiquetaDeSituacao>
                ) : (
                  <EtiquetaDeSituacao tone="aviso" icon={Clock}>
                    Aviso pendente
                  </EtiquetaDeSituacao>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Painel>
  );
}
