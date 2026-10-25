import { Bell, CheckCircle2, Clock, AlertTriangle, ShieldCheck, Globe, Activity, LifeBuoy, Wallet, MessageSquare } from "lucide-react";
import { Painel } from "@/components/plataforma/panel";
import { ListaDeAtencao, type ItemDeAtencao } from "@/components/plataforma/attention-list";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { pluralizar } from "@/lib/formatacao/plural";
import { obterItensDeAtencao } from "@/lib/platform/queries/atencao";

const ICONES = { clock: Clock, alert: AlertTriangle, shield: ShieldCheck, globe: Globe, activity: Activity, life: LifeBuoy, wallet: Wallet, message: MessageSquare } as const;

export async function BlocoDeAtencao({ now }: { now: Date }) {
  const attention = await obterItensDeAtencao(now);
  const attentionItems: ItemDeAtencao[] = attention.map((a) => ({ id: a.id, title: a.title, detail: a.detail, tone: a.tone, icon: ICONES[a.icon], actionLabel: a.actionLabel, href: a.href }));
  return (
    <Painel
      title="Precisa da sua atenção"
      aside={
        attentionItems.length > 0 ? (
          <EtiquetaDeSituacao tone="aviso" icon={Bell}>
            {pluralizar(attentionItems.length, "item", "itens")}
          </EtiquetaDeSituacao>
        ) : undefined
      }
    >
      {attentionItems.length > 0 ? (
        <ListaDeAtencao items={attentionItems} />
      ) : (
        <EstadoVazio icon={CheckCircle2} compact title="Tudo em dia">
          Pedidos de domínio, Pix para conferir, reembolsos e fornecedores na curadoria aparecem aqui.
        </EstadoVazio>
      )}
    </Painel>
  );
}
