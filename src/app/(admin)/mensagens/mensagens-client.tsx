"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, ChevronDown, Link as LinkIcon, MessageCircle, Plus, Search, Send, Trash2, X } from "lucide-react";
import type { Guest } from "@prisma/client";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { PageHeader } from "@/components/admin/page-header";
import { RsvpChip, StatusChip } from "@/components/painel/status-chip";
import { btn, btnDanger, btnIcon, card, chipBase, chipTone, errorBox, hint, input, label, overline, textarea } from "@/components/painel/styles";
import { createMessageTemplate, updateMessageTemplate, deleteMessageTemplate, sendTemplateToGuests } from "@/actions/message-actions";
import { sendRsvpReminders, sendInitialInvites } from "@/actions/whatsapp-actions";
import { weddingSiteUrl } from "@/lib/wedding-links";
import { formatPhoneBR } from "@/lib/wedding-format";
import { isGiftOnlyPending } from "@/lib/guest-origin";

export interface MessageTemplate {
  id: string;
  name: string;
  type?: string | null;
  content: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  buttons?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MensagensClientProps {
  initialTemplates: MessageTemplate[];
  initialGuests: Guest[];
  coupleNames: string;
  /** Endereço público do casamento, para os links das mensagens */
  slug: string;
}

type LinkItem = { id: string; text: string };

const DEFAULT_LINKS: LinkItem[] = [
  { id: "confirm", text: "✅ Confirmar Presença" },
  { id: "decline", text: "❌ Não poderei ir" },
];

const TYPE_LABEL: Record<string, string> = {
  INITIAL_INVITE: "Convite inicial",
  RSVP_REMINDER: "Lembrete de confirmação",
  CUSTOM: "Personalizado",
};

const typeLabel = (t?: string | null) => TYPE_LABEL[t ?? "CUSTOM"] ?? "Personalizado";

function parseLinks(raw?: string | null): LinkItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const hasPhone = (g: Guest) => !!g.phone && g.phone.replace(/\D/g, "").length >= 8;

type Audience = "pending" | "unsent" | "confirmed" | "all" | "custom";

function idsFor(audience: Audience, guests: Guest[]): string[] {
  const withPhone = guests.filter(hasPhone);
  // Quem só presenteou não foi convidado pelo casal: fica fora dos envios por grupo (só escolhendo à mão)
  const invitees = withPhone.filter((g) => !isGiftOnlyPending(g));
  switch (audience) {
    case "pending":
      return invitees.filter((g) => g.rsvpStatus === "PENDING").map((g) => g.id);
    case "unsent":
      return invitees.filter((g) => !g.hasReceivedMessage).map((g) => g.id);
    case "confirmed":
      return withPhone.filter((g) => g.rsvpStatus === "CONFIRMED").map((g) => g.id);
    case "all":
      return withPhone.map((g) => g.id);
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Editor + envio + prévia de um modelo. Recebe `key`, então o estado reinicia ao trocar de modelo.
// ---------------------------------------------------------------------------

function TemplateEditor({
  template,
  guests,
  slug,
  coupleNames,
  onSaved,
  onDeleted,
}: {
  template: MessageTemplate | null;
  guests: Guest[];
  slug: string;
  coupleNames: string;
  onSaved: (t: MessageTemplate, created: boolean) => void;
  onDeleted: (id: string) => void;
}) {
  const router = useRouter();
  const ids = { name: useId(), type: useId(), content: useId(), audience: useId(), media: useId(), mediaUrl: useId(), search: useId() };
  const textRef = useRef<HTMLTextAreaElement>(null);

  const [name, setName] = useState(template?.name ?? "");
  const [content, setContent] = useState(template?.content ?? "");
  const [type, setType] = useState(template?.type ?? "CUSTOM");
  const [mediaUrl, setMediaUrl] = useState(template?.mediaUrl ?? "");
  const [mediaType, setMediaType] = useState(template?.mediaType ?? "image");
  const [links, setLinks] = useState<LinkItem[]>(template ? parseLinks(template.buttons) : DEFAULT_LINKS);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Envio
  const [audience, setAudience] = useState<Audience>(() => (idsFor("pending", guests).length > 0 ? "pending" : "all"));
  const [picked, setPicked] = useState<string[]>(() => idsFor(idsFor("pending", guests).length > 0 ? "pending" : "all", guests));
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const savedLinksJson = JSON.stringify(template ? parseLinks(template.buttons) : DEFAULT_LINKS);
  const dirty =
    !template ||
    name !== template.name ||
    content !== template.content ||
    type !== (template.type ?? "CUSTOM") ||
    mediaUrl !== (template.mediaUrl ?? "") ||
    (mediaUrl !== "" && mediaType !== (template.mediaType ?? "image")) ||
    JSON.stringify(links) !== savedLinksJson;

  const counts = useMemo(
    () => ({
      pending: idsFor("pending", guests).length,
      unsent: idsFor("unsent", guests).length,
      confirmed: idsFor("confirmed", guests).length,
      all: idsFor("all", guests).length,
    }),
    [guests]
  );

  const shownGuests = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return guests;
    const digits = q.replace(/\D/g, "");
    return guests.filter((g) => g.name.toLowerCase().includes(q) || (digits.length >= 3 && !!g.phone && g.phone.replace(/\D/g, "").includes(digits)));
  }, [guests, search]);

  function changeAudience(next: Audience) {
    setAudience(next);
    if (next !== "custom") setPicked(idsFor(next, guests));
    setResult(null);
  }

  function toggleGuest(id: string) {
    setAudience("custom");
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setResult(null);
  }

  function insertVariable(variable: string) {
    const el = textRef.current;
    if (!el) {
      setContent((c) => `${c}${variable}`);
      return;
    }
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const next = content.slice(0, start) + variable + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + variable.length, start + variable.length);
    });
  }

  function addLink() {
    if (links.length >= 3) {
      toast.error("São no máximo 3 links por mensagem.");
      return;
    }
    setLinks([...links, { id: `badge_${Date.now()}`, text: "" }]);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("content", content);
    formData.append("mediaUrl", mediaUrl);
    formData.append("mediaType", mediaType);
    formData.append("type", type);
    formData.append("buttons", JSON.stringify(links.filter((l) => l.text.trim())));

    const toastId = toast.loading("Salvando o modelo...");
    const res = template ? await updateMessageTemplate(template.id, formData) : await createMessageTemplate(formData);
    if (res.success && res.data) {
      toast.success("Modelo salvo.", { id: toastId });
      onSaved(res.data as MessageTemplate, !template);
    } else {
      toast.error(res.error || "Não deu para salvar o modelo. Tente de novo.", { id: toastId });
    }
    setSaving(false);
  }

  async function remove() {
    if (!template) return;
    const toastId = toast.loading("Excluindo o modelo...");
    const res = await deleteMessageTemplate(template.id);
    if (res.success) {
      toast.success("Modelo excluído.", { id: toastId });
      onDeleted(template.id);
    } else {
      toast.error(res.error || "Não deu para excluir agora. Tente de novo.", { id: toastId });
    }
  }

  async function send() {
    if (!template || picked.length === 0) return;
    setSending(true);
    setResult(null);
    const toastId = toast.loading(`Enviando para ${picked.length} ${picked.length === 1 ? "pessoa" : "pessoas"}...`);
    const res = await sendTemplateToGuests(template.id, picked);
    if (res.success) {
      setResult({ ok: true, text: res.message || "Mensagens enviadas." });
      toast.success(res.message || "Mensagens enviadas.", { id: toastId });
      router.refresh();
    } else {
      setResult({ ok: false, text: res.error || "Não deu para enviar agora. Tente de novo." });
      toast.error(res.error || "Não deu para enviar agora.", { id: toastId });
    }
    setSending(false);
  }

  // Prévia: o primeiro destinatário escolhido dá o nome de exemplo
  const sample = guests.find((g) => g.id === picked[0])?.name ?? guests[0]?.name ?? "Nome do convidado";
  const previewText = (content || "O texto da mensagem aparece aqui enquanto vocês escrevem.").replace(/\{nome\}/gi, sample);
  const previewLinks = links
    .filter((l) => l.text.trim())
    .map((l) => {
      const lower = l.text.toLowerCase();
      const gifts = lower.includes("presente") || l.id === "gifts";
      return { text: l.text, url: weddingSiteUrl(slug, gifts ? "presentes" : "rsvp") };
    });

  const lastSent = guests.filter((g) => g.hasReceivedMessage).length;

  return (
    <div className="grid min-w-0 gap-6 min-[1280px]:grid-cols-[minmax(0,1fr)_300px] min-[1280px]:items-start">
      <section className={`${card} flex min-w-0 flex-col gap-5 p-5 sm:p-6`}>
        <form onSubmit={save} className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor={ids.name} className={label}>
                Nome do modelo
              </label>
              <input id={ids.name} required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Lembrete de confirmação" className={input} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor={ids.type} className={label}>
                Para que serve
              </label>
              <select id={ids.type} value={type} onChange={(e) => setType(e.target.value)} className={input}>
                <option value="INITIAL_INVITE">Convite inicial</option>
                <option value="RSVP_REMINDER">Lembrete de confirmação</option>
                <option value="CUSTOM">Personalizado</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={ids.content} className={label}>
              Texto
            </label>
            <textarea
              id={ids.content}
              ref={textRef}
              required
              rows={7}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Oi, {nome}! Aqui são vocês. Ainda não recebemos sua resposta para o casamento..."
              className={`${textarea} min-h-44 resize-y`}
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-tinta-suave">Inserir:</span>
              <button type="button" onClick={() => insertVariable("{nome}")} className={`${chipBase} ${chipTone.neutro} min-h-11 cursor-pointer !pl-3 hover:brightness-95 sm:min-h-8`}>
                {"{nome}"}
              </button>
              <span className="text-sm text-tinta-suave">vira o nome de quem recebe.</span>
            </div>
          </div>

          <fieldset className="flex flex-col gap-3 rounded-xl border border-linha p-4">
            <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-tinta">
              <LinkIcon className="size-4" aria-hidden="true" />
              Links no fim da mensagem
            </legend>
            <p className={hint}>Cada link leva a pessoa direto ao convite ou à lista de presentes. Até 3.</p>
            {links.map((l, idx) => (
              <div key={l.id} className="flex items-center gap-2">
                <input
                  aria-label={`Texto do link ${idx + 1}`}
                  value={l.text}
                  onChange={(e) => setLinks(links.map((x, i) => (i === idx ? { ...x, text: e.target.value } : x)))}
                  placeholder="Ex.: Confirmar presença"
                  className={input}
                />
                <button type="button" aria-label={`Remover o link ${idx + 1}`} onClick={() => setLinks(links.filter((_, i) => i !== idx))} className={btnIcon}>
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              {links.length < 3 && (
                <button type="button" onClick={addLink} className={`${btn.secondary} ${btn.sm}`}>
                  <Plus className="size-4" aria-hidden="true" />
                  Adicionar link
                </button>
              )}
              <button type="button" onClick={() => setLinks(DEFAULT_LINKS)} className={`${btn.quiet} ${btn.sm}`}>
                Confirmar ou recusar
              </button>
              <button
                type="button"
                onClick={() => setLinks([{ id: "gifts", text: "🎁 Ver Lista de Presentes" }, { id: "confirm", text: "✅ Confirmar Presença" }])}
                className={`${btn.quiet} ${btn.sm}`}
              >
                Presentes e confirmar
              </button>
            </div>
          </fieldset>

          <details className="group rounded-xl border border-linha" open={!!mediaUrl}>
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-4 text-sm font-semibold text-tinta">
              Anexar imagem ou arquivo (opcional)
              <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="grid gap-4 px-4 pb-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor={ids.media} className={label}>
                  Tipo do anexo
                </label>
                <select id={ids.media} value={mediaType} onChange={(e) => setMediaType(e.target.value)} className={input}>
                  <option value="image">Imagem (JPG, PNG)</option>
                  <option value="document">Documento (PDF)</option>
                  <option value="audio">Áudio</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor={ids.mediaUrl} className={label}>
                  Endereço do arquivo
                </label>
                <input id={ids.mediaUrl} type="url" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://..." className={input} />
              </div>
            </div>
          </details>

          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={saving || !dirty} className={btn.primary}>
              {saving ? "Salvando..." : template ? "Salvar alterações" : "Salvar modelo"}
            </button>
            {template && (
              <button type="button" onClick={() => setConfirmDelete(true)} className={btnDanger}>
                <Trash2 className="size-4" aria-hidden="true" />
                Excluir modelo
              </button>
            )}
          </div>
        </form>

        <hr className="border-0 border-t border-linha" />

        {/* Envio */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold leading-7 text-tinta">Enviar pelo WhatsApp</h2>
          {!template ? (
            <p className={hint}>Salve o modelo para poder enviar.</p>
          ) : (
            <>
              <div className="flex flex-col gap-2 sm:max-w-sm">
                <label htmlFor={ids.audience} className={label}>
                  Para quem
                </label>
                <select id={ids.audience} value={audience} onChange={(e) => changeAudience(e.target.value as Audience)} className={input}>
                  <option value="pending">Sem resposta ({counts.pending})</option>
                  <option value="unsent">Ainda sem mensagem ({counts.unsent})</option>
                  <option value="confirmed">Confirmados ({counts.confirmed})</option>
                  <option value="all">Todos com telefone ({counts.all})</option>
                  {audience === "custom" && <option value="custom">Escolhidos a dedo ({picked.length})</option>}
                </select>
                <p className={hint}>Só entra quem tem telefone cadastrado.</p>
              </div>

              <details className="group rounded-xl border border-linha">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-4 text-sm font-semibold text-tinta">
                  Escolher pessoas uma a uma
                  <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="flex flex-col gap-3 px-4 pb-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-tinta-suave" aria-hidden="true" />
                    <input id={ids.search} type="search" aria-label="Buscar convidado" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone" className={`${input} pl-10`} />
                  </div>
                  <ul className="max-h-72 divide-y divide-linha overflow-y-auto rounded-xl border border-linha">
                    {shownGuests.length === 0 && <li className="px-4 py-6 text-center text-sm text-tinta-suave">Ninguém com esta busca.</li>}
                    {shownGuests.map((g) => {
                      const ok = hasPhone(g);
                      return (
                        <li key={g.id}>
                          <label className={`flex min-h-14 items-center gap-3 px-3 py-2 ${ok ? "cursor-pointer hover:bg-ameixa-suave/40" : "opacity-60"}`}>
                            <input type="checkbox" disabled={!ok} checked={picked.includes(g.id)} onChange={() => toggleGuest(g.id)} className="size-5 shrink-0 accent-[var(--color-ameixa)]" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-semibold text-tinta">{g.name}</span>
                              <span className="block text-sm text-tinta-suave">{g.phone ? formatPhoneBR(g.phone) : "Sem telefone"}</span>
                            </span>
                            <span className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center">
                              <RsvpChip status={g.rsvpStatus} />
                              {g.hasReceivedMessage && <StatusChip tone="neutro">Já recebeu</StatusChip>}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </details>

              {dirty && <p className="text-sm font-semibold text-aviso">Salve as alterações do modelo antes de enviar: o envio usa a versão salva.</p>}

              {result && (
                <p role={result.ok ? "status" : "alert"} className={result.ok ? "rounded-xl bg-sucesso-suave px-3 py-2 text-sm font-semibold text-sucesso" : errorBox}>
                  {result.text}
                </p>
              )}

              <div>
                <button type="button" onClick={send} disabled={sending || dirty || picked.length === 0} className={btn.primary}>
                  <Send className="size-4" aria-hidden="true" />
                  {sending ? "Enviando..." : picked.length === 0 ? "Escolha quem recebe" : `Enviar para ${picked.length} ${picked.length === 1 ? "pessoa" : "pessoas"}`}
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Prévia */}
      <section aria-label="Prévia no WhatsApp" className="flex min-w-0 flex-col gap-2 min-[1280px]:sticky min-[1280px]:top-24">
        <p className={overline}>Como chega</p>
        <div className="flex flex-col gap-2 rounded-3xl bg-areia p-4">
          <div className="flex items-center gap-2 pb-1 text-sm font-semibold text-tinta">
            <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{coupleNames}</span>
          </div>
          <div className="max-w-[92%] self-start rounded-[4px_16px_16px_16px] bg-papel px-3 py-2.5 text-sm leading-5 text-tinta shadow-[var(--shadow-aceito-1)]">
            {mediaUrl && mediaType === "image" && (
              // eslint-disable-next-line @next/next/no-img-element -- prévia de um endereço qualquer informado pelo casal
              <img src={mediaUrl} alt="Imagem anexada" className="mb-2 max-h-36 w-full rounded-lg object-cover" />
            )}
            {mediaUrl && mediaType !== "image" && <p className="mb-2 text-tinta-suave">Anexo: {mediaType === "document" ? "documento" : "áudio"}</p>}
            <p className="whitespace-pre-wrap break-words">{previewText}</p>
            {previewLinks.length > 0 && (
              <div className="mt-2 flex flex-col gap-1.5 border-t border-linha pt-2">
                {previewLinks.map((l, i) => (
                  <p key={i} className="break-all">
                    <span className="font-semibold">{l.text}</span>
                    <br />
                    <span className="text-ameixa underline">{l.url}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className={hint}>
          {lastSent > 0 ? `${lastSent} ${lastSent === 1 ? "convidado já recebeu" : "convidados já receberam"} alguma mensagem.` : "Ainda não saiu nenhuma mensagem para os convidados."}
        </p>
      </section>

      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          void remove();
        }}
        title="Excluir modelo"
        description="Excluir este modelo de mensagem? Não dá para desfazer."
        confirmText="Excluir"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tela
// ---------------------------------------------------------------------------

export function MensagensClient({ initialTemplates, initialGuests, coupleNames, slug }: MensagensClientProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<MessageTemplate[]>(initialTemplates);
  // null = escrevendo um modelo novo
  const [selectedId, setSelectedId] = useState<string | null>(initialTemplates[0]?.id ?? null);
  const [shortcut, setShortcut] = useState<"invites" | "reminders" | null>(null);

  const selected = templates.find((t) => t.id === selectedId) ?? null;

  const invitesToSend = initialGuests.filter((g) => !g.hasReceivedMessage && hasPhone(g) && !isGiftOnlyPending(g)).length;
  const remindersToSend = initialGuests.filter((g) => g.rsvpStatus === "PENDING" && g.hasReceivedMessage && hasPhone(g) && !isGiftOnlyPending(g)).length;

  async function runShortcut(kind: "invites" | "reminders") {
    setShortcut(kind);
    const toastId = toast.loading(kind === "invites" ? "Enviando os convites..." : "Enviando os lembretes...");
    const res = kind === "invites" ? await sendInitialInvites() : await sendRsvpReminders();
    if (res.success) {
      toast.success(res.message, { id: toastId });
      router.refresh();
    } else {
      toast.error(res.error || "Não deu para enviar agora. Tente de novo.", { id: toastId });
    }
    setShortcut(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Convidados"
        title="Mensagens"
        description="Escrevam os modelos e enviem convites e lembretes pelo WhatsApp."
        actions={
          <button type="button" onClick={() => setSelectedId(null)} className={btn.secondary}>
            <Plus className="size-4" aria-hidden="true" />
            Nova mensagem
          </button>
        }
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-col gap-4 lg:w-60 lg:flex-none">
          <nav aria-label="Modelos">
            <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0">
              {templates.map((t) => {
                const active = t.id === selectedId;
                return (
                  <li key={t.id} className="shrink-0 lg:shrink">
                    <button
                      type="button"
                      aria-current={active ? "true" : undefined}
                      onClick={() => setSelectedId(t.id)}
                      className={`flex min-h-14 w-56 cursor-pointer flex-col rounded-xl p-3 text-left transition-colors lg:w-full ${active ? "bg-ameixa-suave" : "border border-linha bg-papel hover:bg-ameixa-suave/50 lg:border-0 lg:bg-transparent"}`}
                    >
                      <strong className={`line-clamp-2 font-semibold ${active ? "text-ameixa" : "text-tinta"}`}>{t.name}</strong>
                      <span className="text-sm text-tinta-suave">{typeLabel(t.type)}</span>
                    </button>
                  </li>
                );
              })}
              {templates.length === 0 && <li className="px-1 text-sm text-tinta-suave">Ainda não tem nenhum modelo. Escreva o primeiro abaixo.</li>}
            </ul>
          </nav>

          <section className={`${card} hidden flex-col gap-3 p-4 lg:flex`} aria-labelledby="envios-prontos">
            <h2 id="envios-prontos" className="flex items-center gap-2 text-base font-semibold text-tinta">
              <Bell className="size-4" aria-hidden="true" />
              Envios prontos
            </h2>
            <p className={hint}>Usam os modelos de convite inicial e de lembrete.</p>
            <button type="button" disabled={shortcut !== null || invitesToSend === 0} onClick={() => runShortcut("invites")} className={`${btn.secondary} ${btn.sm}`}>
              {invitesToSend === 0 ? "Todos já têm convite" : `Convite para ${invitesToSend} ${invitesToSend === 1 ? "pessoa" : "pessoas"}`}
            </button>
            <button type="button" disabled={shortcut !== null || remindersToSend === 0} onClick={() => runShortcut("reminders")} className={`${btn.secondary} ${btn.sm}`}>
              {remindersToSend === 0 ? "Ninguém para lembrar" : `Lembrete para ${remindersToSend} ${remindersToSend === 1 ? "pessoa" : "pessoas"}`}
            </button>
          </section>
        </div>

        <div className="min-w-0 flex-1">
          <TemplateEditor
            key={selectedId ?? "novo"}
            template={selected}
            guests={initialGuests}
            slug={slug}
            coupleNames={coupleNames}
            onSaved={(t, created) => {
              setTemplates((prev) => (created ? [t, ...prev] : prev.map((x) => (x.id === t.id ? t : x))));
              setSelectedId(t.id);
            }}
            onDeleted={(id) => {
              const rest = templates.filter((t) => t.id !== id);
              setTemplates(rest);
              setSelectedId(rest[0]?.id ?? null);
            }}
          />
        </div>
      </div>

      {/* Envios prontos no celular, depois do editor */}
      <section className={`${card} flex flex-col gap-3 p-4 lg:hidden`} aria-labelledby="envios-prontos-m">
        <h2 id="envios-prontos-m" className="flex items-center gap-2 text-base font-semibold text-tinta">
          <Bell className="size-4" aria-hidden="true" />
          Envios prontos
        </h2>
        <button type="button" disabled={shortcut !== null || invitesToSend === 0} onClick={() => runShortcut("invites")} className={btn.secondary}>
          {invitesToSend === 0 ? "Todos já têm convite" : `Convite para ${invitesToSend} ${invitesToSend === 1 ? "pessoa" : "pessoas"}`}
        </button>
        <button type="button" disabled={shortcut !== null || remindersToSend === 0} onClick={() => runShortcut("reminders")} className={btn.secondary}>
          {remindersToSend === 0 ? "Ninguém para lembrar" : `Lembrete para ${remindersToSend} ${remindersToSend === 1 ? "pessoa" : "pessoas"}`}
        </button>
      </section>
    </div>
  );
}
