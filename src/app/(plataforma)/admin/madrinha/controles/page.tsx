import Link from "next/link";
import { ChevronLeft, Info, Lock, Pause, ShieldCheck } from "lucide-react";
import { CabecalhoDaPagina } from "@/components/plataforma/page-header";
import { Painel } from "@/components/plataforma/panel";
import { Aviso, EtiquetaDeInativo } from "@/components/plataforma/notices";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { estiloDoBotao } from "@/components/landing/styles";
import { Input } from "@/components/ui/input";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { obterConfiguracaoDaPlataforma } from "@/lib/platform/settings";
import { obterDadosDasConfiguracoesDaMadrinha, listarVersoesDasInstrucoes, listarArtigosDeConhecimento, listarExcecoesDaMadrinha } from "@/lib/platform/queries/madrinha";
import { EditorDeInstrucoes } from "../_components/instructions-editor";
import { BaseDeConhecimento } from "../_components/knowledge-base";
import { CartaoDeCapacidades } from "../_components/capabilities-card";
import { AlternanciasDoCasamento } from "../_components/wedding-toggles";
import { SeloDeConfiguracao } from "../../_sistema/setting-badge";

export const metadata = { title: "Comportamento e qualidade da Liz" };

export default async function Page() {
  await exigirAdminDaPlataformaNaPagina(); // guard da página (o layout sozinho não basta)
  const [versions, articles, capabilities, meta, overrides] = await Promise.all([
    listarVersoesDasInstrucoes(),
    listarArtigosDeConhecimento(),
    obterConfiguracaoDaPlataforma("madrinha.capabilities"),
    obterDadosDasConfiguracoesDaMadrinha(),
    listarExcecoesDaMadrinha(30),
  ]);

  return (
    <>
      <CabecalhoDaPagina
        eyebrow="Liz"
        title="Comportamento e qualidade"
        description="Como a Liz fala, o que ela sabe e como você confere se está ajudando."
        actions={
          <Link href="/admin/madrinha" className={estiloDoBotao.secondary}>
            <ChevronLeft className="size-4" aria-hidden="true" /> Voltar à gestão
          </Link>
        }
      />

      <Aviso tone="aviso" icon={Info} title="A Liz ainda não foi ativada" aside={<EtiquetaDeInativo />}>
        Você já pode escrever as instruções e a base de conhecimento. Não há conversas para medir a qualidade.
      </Aviso>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <EditorDeInstrucoes
            key={versions[0]?.id ?? "vazio"}
            versions={versions.map((v) => ({
              id: v.id,
              version: v.version,
              content: v.content,
              changeNote: v.changeNote,
              status: v.status,
              createdAt: v.createdAt.toISOString(),
              createdByName: v.createdByName,
            }))}
          />
          <BaseDeConhecimento
            articles={articles.map((a) => ({ id: a.id, title: a.title, content: a.content, status: a.status, updatedAt: a.updatedAt.toISOString() }))}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Painel title="Modelo">
            <p className="flex items-center gap-2 rounded-xl bg-areia p-3 text-[15px] font-semibold text-tinta">
              <Lock className="size-4 text-tinta-suave" aria-hidden="true" /> Ainda não definido
            </p>
            <p className="mt-3 text-sm leading-5 text-tinta-suave">O modelo será escolhido quando a conexão com a API for feita. Trocar de modelo muda o custo e o jeito de responder.</p>
          </Painel>

          <CartaoDeCapacidades initial={capabilities} badge={<SeloDeConfiguracao {...meta["madrinha.capabilities"]} />} />

          <AlternanciasDoCasamento initial={overrides.map((o) => ({ id: o.weddingId, coupleNames: o.coupleNames, enabled: o.enabled, blocked: o.blockedAt !== null }))} />

          <section aria-labelledby="pausar-t" className="flex flex-col gap-3 rounded-2xl border border-perigo/40 bg-papel p-5 shadow-[var(--shadow-aceito-1)] md:p-6">
            <h2 id="pausar-t" className="flex items-center gap-2 text-xl font-semibold leading-7 text-tinta">
              <Pause className="size-5 text-perigo" aria-hidden="true" /> Pausar a Liz para todos
            </h2>
            <p className="text-sm leading-5 text-tinta-suave">Para quando algo sair do controle: os casais veem um aviso gentil e a Liz descansa. Só dá para pausar depois que ela for ativada.</p>
            <Input label="Motivo (fica no registro)" disabled />
            <div>
              <button type="button" disabled className={`${estiloDoBotao.secondary} text-perigo`}>
                <Pause className="size-4" aria-hidden="true" /> Pausar para todos
              </button>
            </div>
          </section>
        </div>
      </div>

      <Painel title="Qualidade">
        <EstadoVazio icon={ShieldCheck} compact title="Ainda não há conversas para avaliar">
          Quando a Liz for ativada, aqui aparecem as respostas úteis, a taxa de erro e as conversas marcadas pelo casal. Você só lê conversas marcadas ou de casais que derem consentimento, com nomes, telefones e e-mails ocultos (LGPD).
        </EstadoVazio>
      </Painel>
    </>
  );
}
