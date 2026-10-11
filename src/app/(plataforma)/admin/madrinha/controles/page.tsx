import Link from "next/link";
import { ChevronLeft, Info, Lock, Pause, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/plataforma/page-header";
import { Panel } from "@/components/plataforma/panel";
import { Notice, NotActiveTag } from "@/components/plataforma/notices";
import { EmptyState } from "@/components/plataforma/empty-state";
import { btn } from "@/components/landing/styles";
import { Input } from "@/components/ui/input";
import { requirePlatformAdminPage } from "@/lib/security/platform-admin";
import { getPlatformSetting } from "@/lib/platform/settings";
import { getMadrinhaSettingsMeta, listInstructionVersions, listKnowledgeArticles, listMadrinhaOverrides } from "@/lib/platform/queries/madrinha";
import { InstructionsEditor } from "../_components/instructions-editor";
import { KnowledgeBase } from "../_components/knowledge-base";
import { CapabilitiesCard } from "../_components/capabilities-card";
import { WeddingToggles } from "../_components/wedding-toggles";
import { SettingBadge } from "../../_sistema/setting-badge";

export const metadata = { title: "Comportamento e qualidade da Madrinha" };

export default async function Page() {
  await requirePlatformAdminPage(); // guard da página (o layout sozinho não basta)
  const [versions, articles, capabilities, meta, overrides] = await Promise.all([
    listInstructionVersions(),
    listKnowledgeArticles(),
    getPlatformSetting("madrinha.capabilities"),
    getMadrinhaSettingsMeta(),
    listMadrinhaOverrides(30),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Madrinha"
        title="Comportamento e qualidade"
        description="Como a Madrinha fala, o que ela sabe e como você confere se está ajudando."
        actions={
          <Link href="/admin/madrinha" className={btn.secondary}>
            <ChevronLeft className="size-4" aria-hidden="true" /> Voltar à gestão
          </Link>
        }
      />

      <Notice tone="aviso" icon={Info} title="A Madrinha ainda não foi ativada" aside={<NotActiveTag />}>
        Você já pode escrever as instruções e a base de conhecimento. Não há conversas para medir a qualidade.
      </Notice>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <InstructionsEditor
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
          <KnowledgeBase
            articles={articles.map((a) => ({ id: a.id, title: a.title, content: a.content, status: a.status, updatedAt: a.updatedAt.toISOString() }))}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Panel title="Modelo">
            <p className="flex items-center gap-2 rounded-xl bg-areia p-3 text-[15px] font-semibold text-tinta">
              <Lock className="size-4 text-tinta-suave" aria-hidden="true" /> Ainda não definido
            </p>
            <p className="mt-3 text-sm leading-5 text-tinta-suave">O modelo será escolhido quando a conexão com a API for feita. Trocar de modelo muda o custo e o jeito de responder.</p>
          </Panel>

          <CapabilitiesCard initial={capabilities} badge={<SettingBadge {...meta["madrinha.capabilities"]} />} />

          <WeddingToggles initial={overrides.map((o) => ({ id: o.weddingId, coupleNames: o.coupleNames, enabled: o.enabled, blocked: o.blockedAt !== null }))} />

          <section aria-labelledby="pausar-t" className="flex flex-col gap-3 rounded-2xl border border-perigo/40 bg-papel p-5 shadow-[var(--shadow-aceito-1)] md:p-6">
            <h2 id="pausar-t" className="flex items-center gap-2 text-xl font-semibold leading-7 text-tinta">
              <Pause className="size-5 text-perigo" aria-hidden="true" /> Pausar a Madrinha para todos
            </h2>
            <p className="text-sm leading-5 text-tinta-suave">Para quando algo sair do controle: os casais veem um aviso gentil e a Madrinha descansa. Só dá para pausar depois que ela for ativada.</p>
            <Input label="Motivo (fica no registro)" disabled />
            <div>
              <button type="button" disabled className={`${btn.secondary} text-perigo`}>
                <Pause className="size-4" aria-hidden="true" /> Pausar para todos
              </button>
            </div>
          </section>
        </div>
      </div>

      <Panel title="Qualidade">
        <EmptyState icon={ShieldCheck} compact title="Ainda não há conversas para avaliar">
          Quando a Madrinha for ativada, aqui aparecem as respostas úteis, a taxa de erro e as conversas marcadas pelo casal. Você só lê conversas marcadas ou de casais que derem consentimento, com nomes, telefones e e-mails ocultos (LGPD).
        </EmptyState>
      </Panel>
    </>
  );
}
