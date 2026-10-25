import Link from "next/link";
import { CheckCircle2, Circle, Info, Lock, Pause, ShieldCheck } from "lucide-react";
import { CabecalhoDaPagina } from "@/components/plataforma/page-header";
import { AvatarDaLiz } from "@/components/liz/liz-illustration";
import { Painel } from "@/components/plataforma/panel";
import { Aviso, EtiquetaDeInativo } from "@/components/plataforma/notices";
import { CartaoDeIndicador, GradeDeIndicadores } from "@/components/plataforma/stat-card";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { estiloDoBotao } from "@/components/landing/styles";
import { Interruptor } from "@/components/ui/switch";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { obterVisaoGeralDaMadrinha, listarExcecoesDaMadrinha } from "@/lib/platform/queries/madrinha";
import { formatarDiaEMes } from "@/lib/platform/format";
import { FormularioContraAbuso, FormularioDoTetoGlobal, FormularioDeLimites } from "./_components/config-forms";
import { AjusteDoCasamento } from "./_components/wedding-adjust";
import { SeloDeConfiguracao } from "../_sistema/setting-badge";

export const metadata = { title: "Liz" };

export default async function Page() {
  await exigirAdminDaPlataformaNaPagina(); // guard da página (o layout sozinho não basta)
  const [overview, overrides] = await Promise.all([obterVisaoGeralDaMadrinha(), listarExcecoesDaMadrinha(20)]);
  const { limits, globalCap, abuse, meta, latestInstruction, suggestedOnly } = overview;

  const instructionStatus = suggestedOnly
    ? { done: false, text: "Só o texto sugerido" }
    : latestInstruction
    ? latestInstruction.status === "PUBLISHED"
      ? { done: true, text: `Versão ${latestInstruction.version} publicada` }
      : { done: false, text: `Rascunho ${latestInstruction.version} salvo` }
    : { done: false, text: "Pendente" };
  const checklist = [
    { label: "Conectar a chave da API", done: false, text: "Pendente" },
    { label: "Escrever as instruções", done: instructionStatus.done, text: instructionStatus.text },
    { label: "Definir tetos de custo", done: meta["madrinha.globalCap"].saved, text: meta["madrinha.globalCap"].saved ? "Feito" : "Pendente" },
    { label: "Testar com a equipe", done: false, text: "Pendente" },
  ];

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
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

        <Painel title="Uso e custo do mês" aside={<EtiquetaDeInativo>Sem dados ainda</EtiquetaDeInativo>}>
          <GradeDeIndicadores cols={3}>
            <CartaoDeIndicador label="Assinantes" value="—" hint="Sem dados ainda. Não há plano da Liz à venda." />
            <CartaoDeIndicador label="Mensagens no mês" value="—" hint="Sem dados ainda." />
            <CartaoDeIndicador label="Custo estimado" value="—" hint="Sem dados ainda." />
          </GradeDeIndicadores>
          <p className="mt-4 text-sm leading-5 text-tinta-suave">Quando a Liz for ativada, o uso, o custo e as conversas recusadas aparecem aqui, calculados do que de fato aconteceu.</p>
        </Painel>
      </div>

      <Painel title="Assinantes, consumo e conversas recusadas">
        <EstadoVazio icon={ShieldCheck} compact title="Ainda não há o que mostrar">
          Aqui vão aparecer o consumo por casal, a receita e o custo por mês e as perguntas recusadas por fugir do tema, sem nomes, telefones nem e-mails. Ler uma conversa inteira exige o consentimento do casal.
        </EstadoVazio>
      </Painel>

      <section aria-labelledby="limites-t" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="limites-t" className="text-xl font-semibold leading-7 text-tinta">
            Limites por plano
          </h2>
          <SeloDeConfiguracao {...meta["madrinha.limits"]} />
        </div>
        <FormularioDeLimites subscription={limits.subscription} trial={limits.trial} />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Painel title="Teto mensal global" aside={<SeloDeConfiguracao {...meta["madrinha.globalCap"]} />} className="flex flex-col">
          <FormularioDoTetoGlobal monthlyCostCapCents={globalCap.monthlyCostCapCents} warnPercent={globalCap.warnPercent} pauseAtCap={globalCap.pauseAtCap} />
        </Painel>
        <Painel title="Bloqueio por abuso" aside={<SeloDeConfiguracao {...meta["madrinha.abuse"]} />} className="flex flex-col">
          <FormularioContraAbuso perHour={abuse.perHour} blockHours={abuse.blockHours} blockOffTopic={abuse.blockOffTopic} offTopicBeforeBlock={abuse.offTopicBeforeBlock} />
        </Painel>
        <Painel title="Ajuste para um casal" className="flex flex-col">
          <AjusteDoCasamento />
        </Painel>
      </div>

      <Painel title="Casais com ajuste" description="Quem tem a Liz ligada, desligada ou bloqueada à mão, ou mensagens a mais.">
        {overrides.length === 0 ? (
          <p className="text-sm text-tinta-suave">Nenhum casal com ajuste ainda.</p>
        ) : (
          <ul className="divide-y divide-linha">
            {overrides.map((o) => (
              <li key={o.weddingId} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
                <div className="min-w-0">
                  <Link href={`/admin/casais/${o.weddingId}`} className="font-semibold text-tinta underline-offset-2 hover:underline">
                    {o.coupleNames}
                  </Link>
                  <p className="text-sm text-tinta-suave">
                    Atualizado em {formatarDiaEMes(o.updatedAt)}
                    {o.note ? ` · ${o.note}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {o.blockedAt && <EtiquetaDeSituacao tone="perigo">Bloqueado</EtiquetaDeSituacao>}
                  {o.enabled === true && <EtiquetaDeSituacao tone="sucesso">Ligada à mão</EtiquetaDeSituacao>}
                  {o.enabled === false && <EtiquetaDeSituacao tone="neutro">Desligada à mão</EtiquetaDeSituacao>}
                  {o.extraMessages > 0 && <EtiquetaDeSituacao tone="salvia">+{o.extraMessages} mensagens</EtiquetaDeSituacao>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Painel>
    </>
  );
}
