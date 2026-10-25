import { ShieldCheck } from "lucide-react";
import { Painel } from "@/components/plataforma/panel";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { obterConfiguracaoDaPlataforma } from "@/lib/platform/settings";
import { obterDadosDasConfiguracoesDaMadrinha, listarVersoesDasInstrucoes, listarArtigosDeConhecimento, listarExcecoesDaMadrinha } from "@/lib/platform/queries/madrinha";
import { EditorDeInstrucoes } from "../_components/instructions-editor";
import { BaseDeConhecimento } from "../_components/knowledge-base";
import { CartaoDeCapacidades } from "../_components/capabilities-card";
import { AlternanciasDoCasamento } from "../_components/wedding-toggles";
import { SeloDeConfiguracao } from "../../_sistema/setting-badge";
import { CabecalhoDosControles, PainelDoModelo, SecaoDePausar } from "../_controles/paineis";

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
      <CabecalhoDosControles />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <EditorDeInstrucoes
            key={versions[0]?.id ?? "vazio"}
            versions={versions.map((v) => ({ id: v.id, version: v.version, content: v.content, changeNote: v.changeNote, status: v.status, createdAt: v.createdAt.toISOString(), createdByName: v.createdByName }))}
          />
          <BaseDeConhecimento articles={articles.map((a) => ({ id: a.id, title: a.title, content: a.content, status: a.status, updatedAt: a.updatedAt.toISOString() }))} />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <PainelDoModelo />
          <CartaoDeCapacidades initial={capabilities} badge={<SeloDeConfiguracao {...meta["madrinha.capabilities"]} />} />
          <AlternanciasDoCasamento initial={overrides.map((o) => ({ id: o.weddingId, coupleNames: o.coupleNames, enabled: o.enabled, blocked: o.blockedAt !== null }))} />
          <SecaoDePausar />
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
