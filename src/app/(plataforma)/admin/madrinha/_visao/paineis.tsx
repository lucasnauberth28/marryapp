import Link from "next/link";
import { CheckCircle2, Circle, Info, Lock, Pause, ShieldCheck } from "lucide-react";
import { AvatarDaLiz } from "@/components/liz/liz-illustration";
import { CabecalhoDaPagina } from "@/components/plataforma/page-header";
import { Painel } from "@/components/plataforma/panel";
import { Aviso, EtiquetaDeInativo } from "@/components/plataforma/notices";
import { CartaoDeIndicador, GradeDeIndicadores } from "@/components/plataforma/stat-card";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { estiloDoBotao } from "@/components/landing/styles";
import { Interruptor } from "@/components/ui/switch";

export function CabecalhoDaLiz() {
  return (
    <>
      <CabecalhoDaPagina
        eyebrow="Liz"
        title={
          <span className="flex items-center gap-3">
            <AvatarDaLiz size={56} decorative className="ring-2 ring-ameixa" />
            Liz
          </span>
        }
        description="A assistente do Aceito para os casais: só responde sobre casamento e sobre o Aceito."
        actions={
          <button type="button" disabled className={`${estiloDoBotao.secondary} text-perigo`} title="Só dá para pausar depois que a Liz for ativada">
            <Pause className="size-4" aria-hidden="true" /> Pausar a Liz para todos
          </button>
        }
      />
      <Aviso tone="aviso" icon={Info} title="A Liz ainda não foi ativada" aside={<EtiquetaDeInativo />}>
        Nenhuma conexão com a API foi feita. Você já pode salvar os limites, os tetos e as instruções para quando ela for ativada. Por enquanto não há conversas, uso nem custos.
      </Aviso>
    </>
  );
}

export function PainelInterruptorGeral({ checklist }: { checklist: { label: string; done: boolean; text: string }[] }) {
  return (
    <Painel title="Interruptor geral">
      <div className="flex items-start justify-between gap-4 border-b border-linha pb-4">
        <div className="min-w-0">
          <p id="master-t" className="text-[15px] font-semibold leading-5 text-tinta">
            Liz ligada para os casais
          </p>
          <p id="master-d" className="mt-0.5 text-sm leading-5 text-tinta-suave">
            <Lock className="mr-1 inline size-3.5 align-[-2px]" aria-hidden="true" />
            Travado: só libera depois que a conexão com a API estiver pronta.
          </p>
        </div>
        <Interruptor checked={false} disabled aria-labelledby="master-t" aria-describedby="master-d" className="mt-0.5" />
      </div>
      <ul className="mt-2 divide-y divide-linha">
        {checklist.map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-3 py-3 text-[15px]">
            <span className="flex items-center gap-2.5 text-tinta">
              {item.done ? <CheckCircle2 className="size-5 text-sucesso" aria-hidden="true" /> : <Circle className="size-5 text-tinta-suave" aria-hidden="true" />}
              {item.label}
            </span>
            <span className="text-sm text-tinta-suave">{item.text}</span>
          </li>
        ))}
      </ul>
      <Link href="/admin/madrinha/controles" className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm} mt-4`}>
        Editar instruções e conhecimento
      </Link>
    </Painel>
  );
}

export function PainelDeUsoDoMes() {
  return (
    <Painel title="Uso e custo do mês" aside={<EtiquetaDeInativo>Sem dados ainda</EtiquetaDeInativo>}>
      <GradeDeIndicadores cols={3}>
        <CartaoDeIndicador label="Assinantes" value="—" hint="Sem dados ainda. Não há plano da Liz à venda." />
        <CartaoDeIndicador label="Mensagens no mês" value="—" hint="Sem dados ainda." />
        <CartaoDeIndicador label="Custo estimado" value="—" hint="Sem dados ainda." />
      </GradeDeIndicadores>
      <p className="mt-4 text-sm leading-5 text-tinta-suave">Quando a Liz for ativada, o uso, o custo e as conversas recusadas aparecem aqui, calculados do que de fato aconteceu.</p>
    </Painel>
  );
}

export function PainelDeConsumo() {
  return (
    <Painel title="Assinantes, consumo e conversas recusadas">
      <EstadoVazio icon={ShieldCheck} compact title="Ainda não há o que mostrar">
        Aqui vão aparecer o consumo por casal, a receita e o custo por mês e as perguntas recusadas por fugir do tema, sem nomes, telefones nem e-mails. Ler uma conversa inteira exige o consentimento do casal.
      </EstadoVazio>
    </Painel>
  );
}
