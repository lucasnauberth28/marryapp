"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Link2, Mail, Megaphone, Send, Settings, Clock, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { FormAlert } from "@/components/ui/field";
import { Panel } from "@/components/plataforma/panel";
import { StatusChip } from "@/components/plataforma/status-chip";
import { card } from "@/components/casal/ui";
import { cn } from "@/lib/utils";
import {
  ANNOUNCEMENT_TEMPLATES,
  CHANNEL_LABEL,
  COUPLE_PLAN_GROUPS,
  PLAN_GROUP_LABEL,
  VENDOR_PLAN_GROUPS,
  WEDDING_WINDOWS,
  WHATSAPP_DISABLED_REASON,
  WINDOW_LABEL,
  announcementInput,
  bodyParagraphs,
  validateLinkUrl,
  type Audience,
  type Channel,
} from "@/lib/platform/announcement";
import { formatInt, plural } from "@/lib/platform/format";
import {
  deleteAnnouncementDraft,
  previewAnnouncementAudience,
  saveAnnouncementDraft,
  sendAnnouncementNow,
  sendAnnouncementTestToMe,
} from "@/actions/admin-comunicados-actions";
import type { AudiencePreview } from "@/lib/platform/queries/comunicados";
import { useAdminAction } from "../../_sistema/use-admin-action";

export interface ComposeInitial {
  id?: string;
  title: string;
  emailSubject: string;
  body: string;
  linkUrl: string;
  audience: Audience;
  channels: Channel[];
}

export interface DraftItem {
  id: string;
  title: string;
  updatedAtLabel: string;
}

const TEMPLATE_ICON = { manutencao: Settings, novidade: Megaphone, plano: Clock } as const;

export function Compose({ initial, initialPreview, drafts, emailConfigured }: { initial: ComposeInitial; initialPreview: AudiencePreview | null; drafts: DraftItem[]; emailConfigured: boolean }) {
  const router = useRouter();
  const [draftId, setDraftId] = useState(initial.id);
  const [title, setTitle] = useState(initial.title);
  const [emailSubject, setEmailSubject] = useState(initial.emailSubject);
  const [body, setBody] = useState(initial.body);
  const [linkUrl, setLinkUrl] = useState(initial.linkUrl);
  const [audience, setAudience] = useState<Audience>(initial.audience);
  const [channels, setChannels] = useState<Channel[]>(initial.channels);
  const [preview, setPreview] = useState<AudiencePreview | null>(initialPreview);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewing, setPreviewing] = useState(false); // recalculando o público depois de mudar um filtro
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const ticket = useRef(0);
  const save = useAdminAction();
  const send = useAdminAction();
  const test = useAdminAction();
  const busy = save.pending || send.pending || test.pending;
  const errors = { ...localErrors, ...save.errors, ...test.errors, ...send.errors };
  const formError = send.formError ?? test.formError ?? save.formError;
  const onlyChosen = Boolean(audience.weddingIds?.length);

  const form = () => ({ id: draftId, title, emailSubject, body, linkUrl, audience, channels });

  /** Confere o formulário antes de abrir a confirmação (o servidor confere de novo e é quem manda). */
  function askToSend() {
    const found: Record<string, string> = {};
    const parsed = announcementInput.safeParse(form());
    if (!parsed.success) for (const issue of parsed.error.issues) found[String(issue.path[0] ?? "form")] ??= issue.message;
    const link = validateLinkUrl(linkUrl);
    if (!link.ok) found.linkUrl = link.error;
    setLocalErrors(found);
    if (Object.keys(found).length === 0) setConfirmOpen(true);
  }

  async function refreshPreview(next: Audience) {
    const mine = ++ticket.current;
    setPreviewing(true);
    const result = await previewAnnouncementAudience(next).catch(() => null);
    if (mine !== ticket.current) return; // chegou uma resposta mais nova
    if (result?.success) setPreview(result.preview);
    setPreviewing(false);
  }

  function changeAudience(patch: Partial<Audience>) {
    const next = { ...audience, ...patch };
    setAudience(next);
    void refreshPreview(next);
  }

  function toggleChannel(channel: Channel, on: boolean) {
    setChannels((list) => (on ? [...new Set([...list, channel])] : list.filter((c) => c !== channel)));
  }

  function applyTemplate(id: string) {
    const t = ANNOUNCEMENT_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    setTitle(t.title);
    setBody(t.body);
    setChannels(t.channels);
    const next = { ...audience, service: t.service };
    setAudience(next);
    if (id === "plano") changeAudience({ service: t.service, kind: "vendors", vendorPlans: "pro_master" });
  }

  const audienceText = preview
    ? audience.kind === "couples"
      ? `${plural(preview.couples.matched, "casal", "casais")} de ${formatInt(preview.couples.total)}`
      : audience.kind === "vendors"
        ? `${plural(preview.vendors.matched, "fornecedor", "fornecedores")} de ${formatInt(preview.vendors.total)}`
        : `${plural(preview.couples.matched, "casal", "casais")} e ${plural(preview.vendors.matched, "fornecedor", "fornecedores")}`
    : null;

  const planOptions = audience.kind === "vendors" ? VENDOR_PLAN_GROUPS : COUPLE_PLAN_GROUPS;
  const planValue = audience.kind === "vendors" ? audience.vendorPlans : audience.couplePlans;
  const channelNames = channels.map((c) => CHANNEL_LABEL[c].toLowerCase()).join(", ");

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="modelos-t" className="flex flex-col gap-3">
        <h2 id="modelos-t" className="text-lg font-semibold leading-6 text-tinta">
          Modelos prontos
        </h2>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {ANNOUNCEMENT_TEMPLATES.map((t) => {
            const Icon = TEMPLATE_ICON[t.id as keyof typeof TEMPLATE_ICON] ?? Megaphone;
            return (
              <li key={t.id}>
                <button type="button" onClick={() => applyTemplate(t.id)} className={cn(card, "flex min-h-16 w-full items-center gap-3 p-4 text-left transition-shadow hover:shadow-[var(--shadow-aceito-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ameixa")}>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ameixa-suave text-ameixa">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold leading-5 text-tinta">{t.name}</span>
                    <span className="block text-sm leading-5 text-tinta-suave">{t.hint}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel
          title={draftId ? "Editar rascunho" : "Novo comunicado"}
          aside={
            <StatusChip tone="neutro" icon={Pencil}>
              Rascunho
            </StatusChip>
          }
        >
          <form
            className="flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              askToSend();
            }}
          >
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-3 text-base font-semibold text-tinta">Para quem</legend>
              {onlyChosen && (
                <p className="rounded-xl bg-ameixa-suave px-3 py-2 text-sm leading-5 text-tinta">
                  Só para os {audience.weddingIds?.length} casais escolhidos em Casais.{" "}
                  <button type="button" className="font-semibold text-ameixa underline underline-offset-2" onClick={() => changeAudience({ weddingIds: undefined })}>
                    Tirar essa restrição
                  </button>
                </p>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <NativeSelect
                  label="Público"
                  value={audience.kind}
                  disabled={onlyChosen}
                  onChange={(e) => changeAudience({ kind: e.target.value as Audience["kind"] })}
                >
                  <option value="couples">Casais</option>
                  <option value="vendors">Fornecedores</option>
                  <option value="all">Casais e fornecedores</option>
                </NativeSelect>
                <NativeSelect
                  label="Plano"
                  alwaysFloat
                  value={planValue}
                  disabled={audience.kind === "all"}
                  hint={audience.kind === "all" ? "Vale ao escolher um público" : undefined}
                  onChange={(e) => changeAudience(audience.kind === "vendors" ? { vendorPlans: e.target.value as Audience["vendorPlans"] } : { couplePlans: e.target.value as Audience["couplePlans"] })}
                >
                  {planOptions.map((p) => (
                    <option key={p} value={p}>
                      {PLAN_GROUP_LABEL[p]}
                    </option>
                  ))}
                </NativeSelect>
                <NativeSelect
                  label="Data do casamento"
                  alwaysFloat
                  value={audience.weddingWindow}
                  disabled={audience.kind === "vendors"}
                  hint={audience.kind === "vendors" ? "Só para casais" : undefined}
                  onChange={(e) => changeAudience({ weddingWindow: e.target.value as Audience["weddingWindow"] })}
                >
                  {WEDDING_WINDOWS.map((w) => (
                    <option key={w} value={w}>
                      {WINDOW_LABEL[w]}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <NativeSelect
                label="Tipo de aviso"
                alwaysFloat
                value={audience.service ? "service" : "news"}
                onChange={(e) => changeAudience({ service: e.target.value === "service" })}
                hint={audience.service ? "Aviso do serviço (manutenção, cobrança, segurança): chega mesmo para quem desligou os e-mails." : "Novidade: só chega a quem aceitou receber esse tipo de aviso."}
              >
                <option value="news">Novidade</option>
                <option value="service">Aviso do serviço</option>
              </NativeSelect>
              <p aria-busy={previewing || undefined} className={cn("flex min-h-7 flex-wrap items-center gap-2 text-sm leading-5 text-tinta-suave transition-opacity", previewing && "opacity-60")} aria-live="polite">
                {preview ? (
                  <>
                    <StatusChip tone={preview.people === 0 || preview.tooMany ? "aviso" : "salvia"}>Chega a {audienceText}</StatusChip>
                    <span>{preview.tooMany ? "Passa do limite de 5.000 pessoas por envio." : `${plural(preview.people, "pessoa", "pessoas")} com conta.`}</span>
                  </>
                ) : (
                  <>
                    <span className="sr-only">Calculando o público...</span>
                    <Skeleton className="h-7 w-44 rounded-lg" />
                    <Skeleton className="h-4 w-32 rounded-md" />
                  </>
                )}
              </p>
            </fieldset>

            <fieldset className="flex flex-col gap-3">
              <legend className="mb-3 text-base font-semibold text-tinta">Por onde avisar</legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(["PANEL", "PUSH", "EMAIL"] as const).map((c) => (
                  <div key={c} className="flex min-h-11 items-start gap-3 rounded-xl py-2">
                    <Checkbox id={`canal-${c}`} checked={channels.includes(c)} onCheckedChange={(v) => toggleChannel(c, v === true)} className="mt-0.5" />
                    <div className="min-w-0">
                      <Label htmlFor={`canal-${c}`} className="text-base">
                        {CHANNEL_LABEL[c]}
                      </Label>
                      {c === "EMAIL" && !emailConfigured && <p className="text-sm leading-5 text-aviso">O e-mail não está configurado no servidor.</p>}
                      {c === "PUSH" && <p className="text-sm leading-5 text-tinta-suave">Só para quem ativou os avisos no celular.</p>}
                    </div>
                  </div>
                ))}
                <div className="flex min-h-11 items-start gap-3 rounded-xl py-2">
                  <Checkbox id="canal-WHATSAPP" checked={false} disabled className="mt-0.5" />
                  <div className="min-w-0">
                    <Label htmlFor="canal-WHATSAPP" className="text-base">
                      {CHANNEL_LABEL.WHATSAPP}
                    </Label>
                    <p className="text-sm leading-5 text-tinta-suave">{WHATSAPP_DISABLED_REASON}</p>
                  </div>
                </div>
              </div>
              {errors.channels && (
                <p role="alert" className="text-sm font-semibold text-perigo">
                  {errors.channels}
                </p>
              )}
            </fieldset>

            <fieldset className="flex flex-col gap-4">
              <legend className="mb-3 text-base font-semibold text-tinta">O que dizer</legend>
              <Input label="Título" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} maxLength={90} />
              <Input label="Assunto do e-mail" optional value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} error={errors.emailSubject} maxLength={120} hint="Se ficar vazio, o e-mail usa o título." />
              <Textarea label="Mensagem" value={body} onChange={(e) => setBody(e.target.value)} error={errors.body} rows={5} maxLength={1000} hint="Texto simples. Uma linha em branco separa os parágrafos." />
              <Input label="Link do botão" optional icon={Link2} value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} error={errors.linkUrl} inputMode="url" placeholder="https://" />
            </fieldset>

            {formError && !Object.keys(errors).length && <FormAlert>{formError}</FormAlert>}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={busy}>
                <Send className="size-4" aria-hidden="true" /> Enviar agora
              </Button>
              <Button type="button" variant="outline" disabled={busy && !test.pending} loading={test.pending} onClick={() => test.run(() => sendAnnouncementTestToMe(form()))}>
                Enviar um teste para mim
              </Button>
              <Button
                type="button"
                variant="quiet"
                disabled={busy && !save.pending}
                loading={save.pending}
                onClick={() =>
                  save.run(
                    () => saveAnnouncementDraft(form()),
                    (r) => {
                      setDraftId(r.id);
                      router.refresh();
                    },
                  )
                }
              >
                Salvar rascunho
              </Button>
            </div>
            <p className="text-sm leading-5 text-tinta-suave">O envio é imediato: não há agendamento. Quem já recebeu não recebe de novo se o envio for retomado.</p>
          </form>
        </Panel>

        <div className="flex min-w-0 flex-col gap-6">
          <Panel title="Prévia">
            <div className="flex flex-col gap-5">
              <div>
                <p className="mb-2 text-base font-semibold text-tinta">Aviso no painel</p>
                <div className="rounded-2xl border border-aviso bg-aviso-suave p-4">
                  <p className="flex items-start gap-2 font-semibold leading-5 text-tinta">
                    <Bell className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {title || "Título do comunicado"}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-5 text-tinta">{body || "A mensagem aparece aqui."}</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-base font-semibold text-tinta">Notificação no celular</p>
                <div className="flex items-center gap-3 rounded-2xl bg-areia p-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ameixa font-display text-lg text-on-ameixa" aria-hidden="true">
                    a
                  </span>
                  <p className="min-w-0 text-sm leading-5">
                    <strong className="block font-semibold text-tinta">Aceito</strong>
                    <span className="block truncate text-tinta">{title || "Título do comunicado"}</span>
                  </p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-base font-semibold text-tinta">E-mail</p>
                <div className="rounded-2xl border border-linha bg-papel p-4">
                  <p className="text-xs leading-4 text-tinta-suave">Assunto: {emailSubject.trim() || title.trim() || "(ainda sem assunto)"}</p>
                  <p className="mt-2 font-display text-2xl leading-8 text-tinta">{title || "Título do comunicado"}</p>
                  <div className="mt-2 flex flex-col gap-2 text-sm leading-5 text-tinta">
                    {bodyParagraphs(body).map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                  {linkUrl.trim() && /^https:\/\//i.test(linkUrl.trim()) && (
                    <span className="mt-3 inline-flex min-h-9 items-center rounded-xl bg-ameixa px-4 text-sm font-semibold text-on-ameixa">Abrir</span>
                  )}
                  <Mail className="sr-only" aria-hidden="true" />
                </div>
              </div>
            </div>
          </Panel>

          {drafts.length > 0 && (
            <Panel title="Rascunhos">
              <ul className="divide-y divide-linha">
                {drafts.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                    <Link href={`/admin/comunicados?rascunho=${d.id}`} className="min-w-0 text-[15px] font-semibold leading-5 text-tinta underline-offset-2 hover:underline">
                      {d.title}
                      <span className="block text-sm font-normal text-tinta-suave">{d.updatedAtLabel}</span>
                    </Link>
                    <DeleteDraft id={d.id} current={draftId === d.id} />
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        variant="default"
        title="Enviar o comunicado agora?"
        description={`Vai para ${preview ? plural(preview.people, "pessoa", "pessoas") : "o público escolhido"} por ${channelNames || "nenhum canal"}. Não dá para desfazer nem agendar.`}
        confirmText="Enviar agora"
        isLoading={send.pending}
        onConfirm={() =>
          send.run(
            () => sendAnnouncementNow(form()),
            () => {
              setConfirmOpen(false);
              router.replace("/admin/comunicados");
              router.refresh();
            },
          )
        }
      />
    </div>
  );
}

function DeleteDraft({ id, current }: { id: string; current: boolean }) {
  const router = useRouter();
  const { pending, run } = useAdminAction();
  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending || undefined}
      aria-label="Excluir este rascunho"
      onClick={() =>
        run(
          () => deleteAnnouncementDraft({ id }),
          () => {
            if (current) router.replace("/admin/comunicados");
            router.refresh();
          },
        )
      }
      className="grid size-11 shrink-0 place-items-center rounded-xl text-tinta-suave hover:bg-areia hover:text-perigo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ameixa"
    >
      {pending ? <Spinner /> : <Trash2 className="size-4" aria-hidden="true" />}
    </button>
  );
}
