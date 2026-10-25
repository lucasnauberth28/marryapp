import Link from "next/link";
import { Check, CheckCircle2, ExternalLink, Heart, Wallet } from "lucide-react";
import { CabecalhoDaPagina } from "@/components/plataforma/page-header";
import { Painel } from "@/components/plataforma/panel";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { estiloDoBotao } from "@/components/landing/styles";
import { obterListaDeConfiguracao } from "@/lib/platform/queries/atencao";
import { cn } from "@/lib/utils";

type ItemDaConfiguracao = Awaited<ReturnType<typeof obterListaDeConfiguracao>>[number];

function ChecklistDeAbertura({ checklist }: { checklist: ItemDaConfiguracao[] }) {
  return (
    <ul className="flex flex-col">
      {checklist.map((item) => (
        <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-linha py-4 first:pt-0 last:border-b-0 last:pb-0">
          <span className={cn("grid size-7 shrink-0 place-items-center rounded-full border-2", item.done ? "border-sucesso bg-sucesso text-white" : "border-linha-forte")} aria-hidden="true">
            {item.done && <Check className="size-4" strokeWidth={3} />}
          </span>
          <span className="min-w-0 flex-1 basis-48">
            <span className="block font-semibold text-tinta">{item.title}</span>
            <span className="block text-sm text-tinta-suave">{item.detail}</span>
          </span>
          {item.done ? (
            <EtiquetaDeSituacao tone="sucesso" icon={CheckCircle2}>
              Feito
            </EtiquetaDeSituacao>
          ) : (
            <Link href={item.href} className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm}`}>
              {item.actionLabel}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Versão "Vazia" do desenho: ainda não há nenhum casamento. */
export async function VisaoGeralVazia({ eyebrow, title }: { eyebrow: string; title: string }) {
  const checklist = await obterListaDeConfiguracao();
  const done = checklist.filter((i) => i.done).length;
  return (
    <>
      <CabecalhoDaPagina eyebrow={eyebrow} title={title} description="Tudo pronto por aqui. Falta só o primeiro casal chegar." />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <Painel title="Para abrir as portas" aside={<span className="text-sm text-tinta-suave">{done} de {checklist.length}</span>}>
          <ChecklistDeAbertura checklist={checklist} />
        </Painel>
        <div className="flex flex-col gap-6">
          <Painel title="Receita">
            <EstadoVazio icon={Wallet} compact title="Ainda sem pagamentos">
              Quando chegar o primeiro pagamento, a receita do mês aparece aqui.
            </EstadoVazio>
          </Painel>
          <Painel title="Precisa da sua atenção">
            <EstadoVazio icon={CheckCircle2} compact title="Tudo em dia">
              Pedidos de domínio, Pix para conferir e fornecedores na curadoria aparecem aqui.
            </EstadoVazio>
          </Painel>
        </div>
      </div>
      <Painel title="Novos casais">
        <EstadoVazio
          icon={Heart}
          title="Nenhum casal ainda"
          action={
            <Link href="/planos" className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm} gap-2`}>
              <ExternalLink className="size-4" aria-hidden="true" /> Ver a página de planos
            </Link>
          }
        >
          Quando o primeiro casal criar o casamento, você acompanha o caminho dele até o plano pago.
        </EstadoVazio>
      </Painel>
    </>
  );
}
