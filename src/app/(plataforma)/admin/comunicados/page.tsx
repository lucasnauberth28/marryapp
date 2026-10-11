import { PageHeader } from "@/components/plataforma/page-header";
import { requirePlatformAdminPage } from "@/lib/security/platform-admin";
import { type SearchParams, param } from "@/lib/platform/list-params";
import { isEmailConfigured } from "@/lib/email";
import { audienceSchema, parseWeddingIdsParam, parseAudience, type Audience } from "@/lib/platform/announcement";
import { listDrafts, listHistory, previewAudience } from "@/lib/platform/queries/comunicados";
import { formatDateTime } from "@/lib/platform/format";
import { Compose, type ComposeInitial } from "./_components/compose";
import { History } from "./_components/history";

export const metadata = { title: "Comunicados" };
// O envio roda depois da resposta (after) e usa o tempo máximo desta rota
export const maxDuration = 300;

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requirePlatformAdminPage(); // guard da página (o layout sozinho não basta)
  const query = await searchParams;
  const [drafts, history] = await Promise.all([listDrafts(), listHistory(20)]);

  const draftId = param(query, "rascunho", 40);
  const draft = draftId ? drafts.find((d) => d.id === draftId) : undefined;
  const weddingIds = parseWeddingIdsParam(param(query, "casais", 40 * 500));

  const baseAudience: Audience = draft
    ? draft.audience
    : audienceSchema.parse({ kind: "couples", ...(weddingIds.length ? { weddingIds } : {}) });
  const initial: ComposeInitial = draft
    ? {
        id: draft.id,
        title: draft.title,
        emailSubject: draft.emailSubject ?? "",
        body: draft.body,
        linkUrl: draft.linkUrl ?? "",
        audience: parseAudience(baseAudience),
        channels: draft.channels.filter((c): c is "PANEL" | "PUSH" | "EMAIL" => c !== "WHATSAPP"),
      }
    : { title: "", emailSubject: "", body: "", linkUrl: "", audience: baseAudience, channels: ["PANEL"] };
  const preview = await previewAudience(initial.audience);

  return (
    <>
      <PageHeader eyebrow="Comunicação" title="Comunicados" description="Avise casais e fornecedores, ou só um grupo deles, pelo canal certo." />
      <Compose
        key={draft?.id ?? (weddingIds.join(",") || "novo")}
        initial={initial}
        initialPreview={preview}
        drafts={drafts.map((d) => ({ id: d.id, title: d.title, updatedAtLabel: `Salvo em ${formatDateTime(d.updatedAt)}` }))}
        emailConfigured={isEmailConfigured()}
      />
      <History rows={history} />
    </>
  );
}
