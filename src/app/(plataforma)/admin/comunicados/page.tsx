import { Suspense } from "react";
import { PageHeader } from "@/components/plataforma/page-header";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { type ParametrosDeBusca, parametroDaBusca } from "@/lib/platform/list-params";
import { emailEstaConfigurado } from "@/lib/email";
import { esquemaDoPublico, interpretarParametroDeIdsDeCasamento, interpretarPublico, type Publico } from "@/lib/platform/announcement";
import { listarRascunhos, listarHistorico, preverPublico } from "@/lib/platform/queries/comunicados";
import { formatarDataEHora } from "@/lib/platform/format";
import { TablePanelSkeleton } from "@/components/plataforma/loading-parts";
import { Compose, type ComposeInitial } from "./_components/compose";
import { History } from "./_components/history";

export const metadata = { title: "Comunicados" };
// O envio roda depois da resposta (after) e usa o tempo máximo desta rota
export const maxDuration = 300;

export default async function Page({ searchParams }: { searchParams: Promise<ParametrosDeBusca> }) {
  await exigirAdminDaPlataformaNaPagina(); // guard da página (o layout sozinho não basta)
  const query = await searchParams;
  const drafts = await listarRascunhos();

  const draftId = parametroDaBusca(query, "rascunho", 40);
  const draft = draftId ? drafts.find((d) => d.id === draftId) : undefined;
  const weddingIds = interpretarParametroDeIdsDeCasamento(parametroDaBusca(query, "casais", 40 * 500));

  const baseAudience: Publico = draft
    ? draft.audience
    : esquemaDoPublico.parse({ kind: "couples", ...(weddingIds.length ? { weddingIds } : {}) });
  const initial: ComposeInitial = draft
    ? {
        id: draft.id,
        title: draft.title,
        emailSubject: draft.emailSubject ?? "",
        body: draft.body,
        linkUrl: draft.linkUrl ?? "",
        audience: interpretarPublico(baseAudience),
        channels: draft.channels.filter((c): c is "PANEL" | "PUSH" | "EMAIL" => c !== "WHATSAPP"),
      }
    : { title: "", emailSubject: "", body: "", linkUrl: "", audience: baseAudience, channels: ["PANEL"] };
  const preview = await preverPublico(initial.audience);

  return (
    <>
      <PageHeader eyebrow="Comunicação" title="Comunicados" description="Avise casais e fornecedores, ou só um grupo deles, pelo canal certo." />
      <Compose
        key={draft?.id ?? (weddingIds.join(",") || "novo")}
        initial={initial}
        initialPreview={preview}
        drafts={drafts.map((d) => ({ id: d.id, title: d.title, updatedAtLabel: `Salvo em ${formatarDataEHora(d.updatedAt)}` }))}
        emailConfigured={emailEstaConfigurado()}
      />
      {/* O histórico é a parte mais pesada e fica abaixo do formulário: chega depois, com esqueleto */}
      <Suspense fallback={<TablePanelSkeleton columns={6} rows={3} />}>
        <HistoryBlock />
      </Suspense>
    </>
  );
}

async function HistoryBlock() {
  return <History rows={await listarHistorico(20)} />;
}
