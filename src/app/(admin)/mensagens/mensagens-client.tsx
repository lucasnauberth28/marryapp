"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, Check, ChevronDown, Image as ImageIcon, Link as LinkIcon, MessageCircle, Pencil, Plus, Search, Send, Trash2, UserCheck, X } from "lucide-react";
import type { Guest } from "@prisma/client";
import { ModalDeConfirmacao } from "@/components/ui/confirm-modal";
import { ModalPersonalizado } from "@/components/ui/custom-modal";
import { CabecalhoDaPagina } from "@/components/admin/page-header";
import { EtiquetaDeConfirmacao, EtiquetaDeSituacao } from "@/components/painel/status-chip";
import { Entrada } from "@/components/ui/input";
import { AreaDeTexto } from "@/components/ui/textarea";
import { SelecaoNativa } from "@/components/ui/select";
import { estiloDoBotao, estiloDoBotaoDePerigo, estiloDoBotaoDeIcone, estiloDoCartao, estiloBaseDaEtiqueta, estiloDoTomDaEtiqueta, estiloDaCaixaDeErro, estiloDaDicaDoPainel, estiloDaEntradaDoPainel, estiloDoSobretitulo } from "@/components/painel/styles";
import { BotaoComCarregamento } from "@/components/painel/loading-button";
import { criarModeloDeMensagem, atualizarModeloDeMensagem, excluirModeloDeMensagem, enviarModeloAosConvidados } from "@/actions/message-actions";
import { enviarLembretesDeConfirmacao, enviarConvitesIniciais } from "@/actions/whatsapp-actions";
import { urlDoSiteDoCasamento } from "@/lib/wedding-links";
import { formatarTelefone } from "@/lib/formatacao/telefone";
import { ehSoPresentePendente } from "@/lib/guest-origin";
import { cn } from "@/lib/utils";

import { somenteDigitos } from "@/lib/formatacao/telefone";
export interface ModeloDeMensagem {
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

interface PropriedadesDasMensagensCliente {
  initialTemplates: ModeloDeMensagem[];
  initialGuests: Guest[];
  coupleNames: string;
  /** Endereço público do casamento, para os links das mensagens */
  slug: string;
  /** Domínio próprio conectado: os links das mensagens passam a usá-lo */
  customDomain?: string | null;
}

type ItemDeLink = { id: string; text: string };

const LINKS_PADRAO: ItemDeLink[] = [
  { id: "confirm", text: "✅ Confirmar Presença" },
  { id: "decline", text: "❌ Não poderei ir" },
];
const LINKS_DE_PRESENTE: ItemDeLink[] = [
  { id: "gifts", text: "🎁 Ver Lista de Presentes" },
  { id: "confirm", text: "✅ Confirmar Presença" },
];

const ROTULO_DO_TIPO: Record<string, string> = {
  INITIAL_INVITE: "Convite inicial",
  RSVP_REMINDER: "Lembrete de confirmação",
  CUSTOM: "Personalizada",
};
const rotuloDoTipo = (t?: string | null) => ROTULO_DO_TIPO[t ?? "CUSTOM"] ?? "Personalizada";

function interpretarLinks(raw?: string | null): ItemDeLink[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const temTelefone = (g: Guest) => !!g.phone && somenteDigitos(g.phone).length >= 8;

type Publico = "pending" | "unsent" | "confirmed" | "all" | "custom";

function idsPara(audience: Publico, guests: Guest[]): string[] {
  const withPhone = guests.filter(temTelefone);
  // Quem só presenteou não foi convidado pelo casal: fica fora dos envios por grupo (só escolhendo à mão)
  const invitees = withPhone.filter((g) => !ehSoPresentePendente(g));
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

const PUBLICOS: { id: Exclude<Publico, "custom">; label: string; help: string }[] = [
  { id: "pending", label: "Quem ainda não respondeu", help: "Convidados com o convite sem resposta." },
  { id: "unsent", label: "Quem ainda não recebeu mensagem", help: "Ninguém por aqui mandou nada para eles." },
  { id: "confirmed", label: "Quem confirmou presença", help: "Bom para avisos do dia e do local." },
  { id: "all", label: "Todos com telefone", help: "Cada pessoa recebe uma mensagem só." },
];

function linksParaPrevia(links: ItemDeLink[], slug: string, customDomain?: string | null) {
  return links
    .filter((l) => l.text.trim())
    .map((l) => {
      const lower = l.text.toLowerCase();
      const gifts = lower.includes("presente") || l.id === "gifts";
      return { text: l.text, url: urlDoSiteDoCasamento(slug, gifts ? "presentes" : "rsvp", customDomain) };
    });
}

// ---------------------------------------------------------------------------
// Prévia: como a mensagem chega no WhatsApp
// ---------------------------------------------------------------------------

function PreviaDoWhatsapp({
  coupleNames,
  text,
  sampleName,
  links,
  hasMedia,
  mediaType,
}: {
  coupleNames: string;
  text: string;
  sampleName: string;
  links: { text: string; url: string }[];
  hasMedia: boolean;
  mediaType: string;
}) {
  const body = (text || "O texto da mensagem aparece aqui enquanto vocês escrevem.").replace(/\{nome\}/gi, sampleName);
  return (
    <div className="flex flex-col gap-2 rounded-3xl bg-areia p-4">
      <div className="flex items-center gap-2 pb-1 text-sm font-semibold text-tinta">
        <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{coupleNames}</span>
      </div>
      <div className="max-w-[94%] self-start rounded-[4px_16px_16px_16px] bg-papel px-3 py-2.5 text-sm leading-5 text-tinta shadow-[var(--shadow-aceito-1)]">
        {hasMedia ? (
          <p className="mb-2 flex items-center gap-2 rounded-lg bg-areia px-3 py-2.5 text-tinta-suave">
            <ImageIcon className="size-4 shrink-0" aria-hidden="true" />
            {mediaType === "image" ? "Imagem anexada" : mediaType === "document" ? "Documento anexado" : "Áudio anexado"}
          </p>
        ) : null}
        <p className="whitespace-pre-wrap break-words">{body}</p>
        {links.length > 0 ? (
          <div className="mt-2 flex flex-col gap-1.5 border-t border-linha pt-2">
            {links.map((l, i) => (
              <p key={i} className="break-all">
                <span className="font-semibold">{l.text}</span>
                <br />
                <span className="text-ameixa underline">{l.url}</span>
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Escrever ou editar uma mensagem
// ---------------------------------------------------------------------------

function FormularioDoEditor({
  template,
  sampleName,
  slug,
  customDomain,
  coupleNames,
  onSaved,
  onDeleted,
  onCancel,
}: {
  template: ModeloDeMensagem | null;
  sampleName: string;
  slug: string;
  customDomain?: string | null;
  coupleNames: string;
  onSaved: (t: ModeloDeMensagem, created: boolean) => void;
  onDeleted: (id: string) => void;
  onCancel: () => void;
}) {
  const ids = { name: useId(), type: useId(), content: useId(), media: useId(), mediaUrl: useId() };
  const textRef = useRef<HTMLTextAreaElement>(null);

  const [name, setName] = useState(template?.name ?? "");
  const [content, setContent] = useState(template?.content ?? "");
  const [type, setType] = useState(template?.type ?? "CUSTOM");
  const [mediaUrl, setMediaUrl] = useState(template?.mediaUrl ?? "");
  const [mediaType, setMediaType] = useState(template?.mediaType ?? "image");
  const [links, setLinks] = useState<ItemDeLink[]>(template ? interpretarLinks(template.buttons) : LINKS_PADRAO);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function insertName() {
    const variable = "{nome}";
    const el = textRef.current;
    if (!el) {
      setContent((c) => `${c}${variable}`);
      return;
    }
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    setContent(content.slice(0, start) + variable + content.slice(end));
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
    const toastId = toast.loading("Salvando a mensagem...");
    const res = template ? await atualizarModeloDeMensagem(template.id, formData) : await criarModeloDeMensagem(formData);
    if (res.success && res.data) {
      toast.success("Mensagem salva.", { id: toastId });
      onSaved(res.data as ModeloDeMensagem, !template);
    } else {
      toast.error(res.error || "Não deu para salvar a mensagem. Tente de novo.", { id: toastId });
    }
    setSaving(false);
  }

  async function remove() {
    if (!template) return;
    const toastId = toast.loading("Excluindo a mensagem...");
    const res = await excluirModeloDeMensagem(template.id);
    if (res.success) {
      toast.success("Mensagem excluída.", { id: toastId });
      onDeleted(template.id);
    } else {
      toast.error(res.error || "Não deu para excluir agora. Tente de novo.", { id: toastId });
    }
  }

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <form onSubmit={save} className="flex min-w-0 flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Entrada id={ids.name} label="Nome da mensagem" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Lembrete de confirmação" />
          <SelecaoNativa id={ids.type} label="Para que serve" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="INITIAL_INVITE">Convite inicial</option>
            <option value="RSVP_REMINDER">Lembrete de confirmação</option>
            <option value="CUSTOM">Outro assunto</option>
          </SelecaoNativa>
        </div>

        <div className="flex flex-col gap-2">
          <AreaDeTexto
            id={ids.content}
            label="Texto"
            ref={textRef}
            required
            rows={7}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Oi, {nome}! Aqui são vocês. Ainda não recebemos sua resposta para o casamento..."
            inputClassName="min-h-44"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={insertName} className={`${estiloBaseDaEtiqueta} ${estiloDoTomDaEtiqueta.neutro} min-h-11 cursor-pointer !pl-3 hover:brightness-95 sm:min-h-8`}>
              <UserCheck className="size-4" aria-hidden="true" />
              Pôr o nome de quem recebe
            </button>
            <span className="text-sm text-tinta-suave">Escreve {"{nome}"}: cada pessoa vê o próprio nome.</span>
          </div>
        </div>

        <fieldset className="flex flex-col gap-3 rounded-xl border border-linha p-4">
          <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-tinta">
            <LinkIcon className="size-4" aria-hidden="true" />
            Links no fim da mensagem
          </legend>
          <p className={estiloDaDicaDoPainel}>Cada link leva a pessoa direto ao convite ou à lista de presentes. Até 3.</p>
          {links.map((l, idx) => (
            <div key={l.id} className="flex items-center gap-2">
              <Entrada
                id={`${ids.name}-link-${idx}`}
                label={`Texto do link ${idx + 1}`}
                value={l.text}
                onChange={(e) => setLinks(links.map((x, i) => (i === idx ? { ...x, text: e.target.value } : x)))}
                placeholder="Ex.: Confirmar presença"
                fieldClassName="flex-1"
              />
              <button type="button" aria-label={`Remover o link ${idx + 1}`} onClick={() => setLinks(links.filter((_, i) => i !== idx))} className={estiloDoBotaoDeIcone}>
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            {links.length < 3 ? (
              <button type="button" onClick={addLink} className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm}`}>
                <Plus className="size-4" aria-hidden="true" />
                Adicionar link
              </button>
            ) : null}
            <button type="button" onClick={() => setLinks(LINKS_PADRAO)} className={`${estiloDoBotao.quiet} ${estiloDoBotao.sm}`}>
              Confirmar ou recusar
            </button>
            <button type="button" onClick={() => setLinks(LINKS_DE_PRESENTE)} className={`${estiloDoBotao.quiet} ${estiloDoBotao.sm}`}>
              Presentes e confirmar
            </button>
          </div>
        </fieldset>

        <details className="group rounded-xl border border-linha" open={!!mediaUrl}>
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-4 text-sm font-semibold text-tinta">
            <span className="flex items-center gap-2">
              <ImageIcon className="size-4" aria-hidden="true" />
              Mandar uma imagem ou arquivo junto (opcional)
            </span>
            <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="grid gap-5 px-4 pb-4 pt-2 sm:grid-cols-2">
            <SelecaoNativa id={ids.media} label="O que é" value={mediaType} onChange={(e) => setMediaType(e.target.value)}>
              <option value="image">Foto ou imagem</option>
              <option value="document">Documento em PDF</option>
              <option value="audio">Áudio</option>
            </SelecaoNativa>
            <Entrada id={ids.mediaUrl} type="url" label="Link do arquivo" hint="O endereço do arquivo na internet, que começa com https://" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://..." />
          </div>
        </details>

        <div className="flex flex-wrap items-center gap-2">
          <BotaoComCarregamento type="submit" loading={saving} className={estiloDoBotao.primary}>
            <Check className="size-4" aria-hidden="true" />
            {template ? "Salvar alterações" : "Salvar mensagem"}
          </BotaoComCarregamento>
          <button type="button" onClick={onCancel} className={estiloDoBotao.secondary}>
            Cancelar
          </button>
          {template ? (
            <button type="button" onClick={() => setConfirmDelete(true)} className={`${estiloDoBotaoDePerigo} sm:ml-auto`}>
              <Trash2 className="size-4" aria-hidden="true" />
              Excluir
            </button>
          ) : null}
        </div>
      </form>

      <section aria-label="Prévia no WhatsApp" className="flex min-w-0 flex-col gap-2 lg:sticky lg:top-0">
        <p className={estiloDoSobretitulo}>Como chega</p>
        <PreviaDoWhatsapp coupleNames={coupleNames} text={content} sampleName={sampleName} links={linksParaPrevia(links, slug, customDomain)} hasMedia={!!mediaUrl} mediaType={mediaType} />
      </section>

      <ModalDeConfirmacao
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          void remove();
        }}
        title="Excluir mensagem"
        description="Excluir esta mensagem? Não dá para desfazer."
        confirmText="Excluir"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Enviar: para quem, como vai chegar e um botão só
// ---------------------------------------------------------------------------

function FluxoDeEnvio({ template, guests, slug, customDomain, coupleNames, onDone }: { template: ModeloDeMensagem; guests: Guest[]; slug: string; customDomain?: string | null; coupleNames: string; onDone: () => void }) {
  const router = useRouter();
  const searchId = useId();
  const counts = useMemo(
    () => ({
      pending: idsPara("pending", guests).length,
      unsent: idsPara("unsent", guests).length,
      confirmed: idsPara("confirmed", guests).length,
      all: idsPara("all", guests).length,
    }),
    [guests],
  );
  const firstWith = (counts.pending > 0 ? "pending" : "all") as Publico;
  const [audience, setAudience] = useState<Publico>(firstWith);
  const [picked, setPicked] = useState<string[]>(() => idsPara(firstWith, guests));
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const shownGuests = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return guests;
    const digits = somenteDigitos(q);
    return guests.filter((g) => g.name.toLowerCase().includes(q) || (digits.length >= 3 && !!g.phone && somenteDigitos(g.phone).includes(digits)));
  }, [guests, search]);

  function changeAudience(next: Publico) {
    setAudience(next);
    if (next !== "custom") setPicked(idsPara(next, guests));
    setResult(null);
  }
  function toggleGuest(id: string) {
    setAudience("custom");
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setResult(null);
  }

  async function send() {
    if (picked.length === 0) return;
    setSending(true);
    setResult(null);
    const toastId = toast.loading(`Enviando para ${picked.length} ${picked.length === 1 ? "pessoa" : "pessoas"}...`);
    const res = await enviarModeloAosConvidados(template.id, picked);
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

  const sample = guests.find((g) => g.id === picked[0])?.name ?? guests[0]?.name ?? "Nome do convidado";
  const cnt = (id: Exclude<Publico, "custom">) => counts[id];

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <div className="flex min-w-0 flex-col gap-5">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-base font-semibold text-tinta">Para quem vai?</legend>
          {PUBLICOS.map((a) => {
            const active = audience === a.id;
            const n = cnt(a.id);
            return (
              <label
                key={a.id}
                className={cn(
                  "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[3px] has-[:focus-visible]:outline-ameixa",
                  active ? "border-ameixa bg-ameixa-suave" : "border-linha bg-papel hover:border-ameixa",
                  n === 0 && "opacity-60",
                )}
              >
                <input type="radio" name="para-quem" checked={active} onChange={() => changeAudience(a.id)} className="size-5 shrink-0 accent-[var(--color-ameixa)]" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-tinta">{a.label}</span>
                  <span className="block text-sm text-tinta-suave">{a.help}</span>
                </span>
                <span className="shrink-0 rounded-full bg-areia px-3 py-1 text-sm font-semibold tabular-nums text-tinta">{n}</span>
              </label>
            );
          })}
          <label
            className={cn(
              "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[3px] has-[:focus-visible]:outline-ameixa",
              audience === "custom" ? "border-ameixa bg-ameixa-suave" : "border-linha bg-papel hover:border-ameixa",
            )}
          >
            <input type="radio" name="para-quem" checked={audience === "custom"} onChange={() => changeAudience("custom")} className="size-5 shrink-0 accent-[var(--color-ameixa)]" />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-tinta">Escolher pessoas uma a uma</span>
              <span className="block text-sm text-tinta-suave">Marquem quem recebe, na lista abaixo.</span>
            </span>
            {audience === "custom" ? <span className="shrink-0 rounded-full bg-areia px-3 py-1 text-sm font-semibold tabular-nums text-tinta">{picked.length}</span> : null}
          </label>
          <p className={estiloDaDicaDoPainel}>Só entra quem tem telefone cadastrado.</p>
        </fieldset>

        {audience === "custom" ? (
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-tinta-suave" aria-hidden="true" />
              <input id={searchId} type="search" aria-label="Buscar convidado" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone" className={`${estiloDaEntradaDoPainel} pl-10`} />
            </div>
            <ul className="max-h-72 divide-y divide-linha overflow-y-auto rounded-xl border border-linha">
              {shownGuests.length === 0 ? <li className="px-4 py-6 text-center text-sm text-tinta-suave">Ninguém com esta busca.</li> : null}
              {shownGuests.map((g) => {
                const ok = temTelefone(g);
                return (
                  <li key={g.id}>
                    <label className={`flex min-h-14 items-center gap-3 px-3 py-2 ${ok ? "cursor-pointer hover:bg-ameixa-suave/40" : "opacity-60"}`}>
                      <input type="checkbox" disabled={!ok} checked={picked.includes(g.id)} onChange={() => toggleGuest(g.id)} className="size-5 shrink-0 accent-[var(--color-ameixa)]" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-tinta">{g.name}</span>
                        <span className="block text-sm text-tinta-suave">{g.phone ? formatarTelefone(g.phone) : "Sem telefone"}</span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center">
                        <EtiquetaDeConfirmacao status={g.rsvpStatus} />
                        {g.hasReceivedMessage ? <EtiquetaDeSituacao tone="neutro">Já recebeu</EtiquetaDeSituacao> : null}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {result ? (
          <p role={result.ok ? "status" : "alert"} className={result.ok ? "rounded-xl bg-sucesso-suave px-3 py-2 text-sm font-semibold text-sucesso" : estiloDaCaixaDeErro}>
            {result.text}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <BotaoComCarregamento onClick={send} loading={sending} disabled={picked.length === 0} className={estiloDoBotao.primary}>
            <Send className="size-4" aria-hidden="true" />
            {picked.length === 0 ? "Escolha quem recebe" : `Enviar para ${picked.length} ${picked.length === 1 ? "pessoa" : "pessoas"}`}
          </BotaoComCarregamento>
          <button type="button" onClick={onDone} className={estiloDoBotao.secondary}>
            {result?.ok ? "Fechar" : "Cancelar"}
          </button>
        </div>
      </div>

      <section aria-label="Prévia no WhatsApp" className="flex min-w-0 flex-col gap-2 lg:sticky lg:top-0">
        <p className={estiloDoSobretitulo}>Como chega para {sample.split(" ")[0]}</p>
        <PreviaDoWhatsapp
          coupleNames={coupleNames}
          text={template.content}
          sampleName={sample.split(" ")[0]}
          links={linksParaPrevia(interpretarLinks(template.buttons), slug, customDomain)}
          hasMedia={!!template.mediaUrl}
          mediaType={template.mediaType ?? "image"}
        />
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tela
// ---------------------------------------------------------------------------

export function MensagensCliente({ initialTemplates, initialGuests, coupleNames, slug, customDomain }: PropriedadesDasMensagensCliente) {
  const router = useRouter();
  const [templates, setTemplates] = useState<ModeloDeMensagem[]>(initialTemplates);
  // "novo" = escrevendo uma mensagem nova
  const [editing, setEditing] = useState<ModeloDeMensagem | "novo" | null>(null);
  const [sending, setSending] = useState<ModeloDeMensagem | null>(null);
  const [shortcut, setShortcut] = useState<"invites" | "reminders" | null>(null);

  const withPhone = initialGuests.filter(temTelefone).length;
  const invitesToSend = initialGuests.filter((g) => !g.hasReceivedMessage && temTelefone(g) && !ehSoPresentePendente(g)).length;
  const remindersToSend = initialGuests.filter((g) => g.rsvpStatus === "PENDING" && g.hasReceivedMessage && temTelefone(g) && !ehSoPresentePendente(g)).length;
  const received = initialGuests.filter((g) => g.hasReceivedMessage).length;
  const sample = initialGuests[0]?.name.split(" ")[0] ?? "Nome";

  async function runShortcut(kind: "invites" | "reminders") {
    setShortcut(kind);
    const toastId = toast.loading(kind === "invites" ? "Enviando os convites..." : "Enviando os lembretes...");
    const res = kind === "invites" ? await enviarConvitesIniciais() : await enviarLembretesDeConfirmacao();
    if (res.success) {
      toast.success(res.message, { id: toastId });
      router.refresh();
    } else {
      toast.error(res.error || "Não deu para enviar agora. Tente de novo.", { id: toastId });
    }
    setShortcut(null);
  }

  const quick = [
    {
      kind: "invites" as const,
      title: "Enviar convites",
      text: "O convite inicial vai para quem ainda não recebeu nenhuma mensagem.",
      n: invitesToSend,
      cta: (n: number) => `Enviar convite para ${n} ${n === 1 ? "pessoa" : "pessoas"}`,
      none: "Todos já receberam o convite",
    },
    {
      kind: "reminders" as const,
      title: "Lembrar quem não respondeu",
      text: "O lembrete vai para quem recebeu o convite e ainda não confirmou.",
      n: remindersToSend,
      cta: (n: number) => `Enviar lembrete para ${n} ${n === 1 ? "pessoa" : "pessoas"}`,
      none: "Ninguém para lembrar agora",
    },
  ];

  return (
    <div className="flex flex-col gap-10">
      <CabecalhoDaPagina
        eyebrow="Convidados"
        title="Mensagens"
        description={`${withPhone} ${withPhone === 1 ? "convidado tem" : "convidados têm"} telefone cadastrado${received > 0 ? ` e ${received} já ${received === 1 ? "recebeu" : "receberam"} mensagem por aqui` : ""}.`}
        actions={
          <button type="button" onClick={() => setEditing("novo")} className={estiloDoBotao.secondary}>
            <Plus className="size-4" aria-hidden="true" />
            Nova mensagem
          </button>
        }
      />

      <section aria-labelledby="envios-rapidos" className="flex flex-col gap-4">
        <div>
          <h2 id="envios-rapidos" className="flex items-center gap-2 font-display text-2xl leading-8 text-tinta">
            <Bell className="size-5 text-ameixa" aria-hidden="true" />
            Envios rápidos
          </h2>
          <p className={`${estiloDaDicaDoPainel} mt-1`}>Os dois envios mais comuns, com um toque. Usam as mensagens de convite e de lembrete abaixo.</p>
        </div>
        <ul className="grid gap-4 md:grid-cols-2">
          {quick.map((q) => (
            <li key={q.kind} className={`${estiloDoCartao} flex flex-col gap-4 p-5`}>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold leading-7 text-tinta">{q.title}</h3>
                <p className="text-[15px] leading-6 text-tinta-suave">{q.text}</p>
              </div>
              <div className="mt-auto">
                <BotaoComCarregamento loading={shortcut === q.kind} disabled={shortcut !== null || q.n === 0} onClick={() => runShortcut(q.kind)} className={q.n === 0 ? estiloDoBotao.secondary : estiloDoBotao.primary}>
                  {q.n === 0 ? (
                    <>
                      <Check className="size-4" aria-hidden="true" />
                      {q.none}
                    </>
                  ) : (
                    <>
                      <Send className="size-4" aria-hidden="true" />
                      {q.cta(q.n)}
                    </>
                  )}
                </BotaoComCarregamento>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="suas-mensagens" className="flex flex-col gap-4">
        <div>
          <h2 id="suas-mensagens" className="font-display text-2xl leading-8 text-tinta">
            Suas mensagens
          </h2>
          <p className={`${estiloDaDicaDoPainel} mt-1`}>Escolham uma mensagem para enviar a quem quiserem, ou editem o texto.</p>
        </div>
        {templates.length === 0 ? (
          <div className={`${estiloDoCartao} flex flex-col items-start gap-3 p-6`}>
            <p className="text-[15px] leading-6 text-tinta-suave">Vocês ainda não escreveram nenhuma mensagem.</p>
            <button type="button" onClick={() => setEditing("novo")} className={estiloDoBotao.primary}>
              <Plus className="size-4" aria-hidden="true" />
              Escrever a primeira mensagem
            </button>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {templates.map((t) => (
              <li key={t.id} className={`${estiloDoCartao} flex min-w-0 flex-col gap-3 p-5`}>
                <div className="flex flex-col gap-1.5">
                  <EtiquetaDeSituacao tone="neutro" className="self-start">
                    {rotuloDoTipo(t.type)}
                  </EtiquetaDeSituacao>
                  <h3 className="line-clamp-2 text-lg font-semibold leading-7 text-tinta">{t.name}</h3>
                </div>
                <p className="line-clamp-4 whitespace-pre-line text-[15px] leading-6 text-tinta-suave">{t.content.replace(/\{nome\}/gi, sample)}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-1">
                  <button type="button" onClick={() => setSending(t)} className={estiloDoBotao.primary}>
                    <Send className="size-4" aria-hidden="true" />
                    Enviar
                  </button>
                  <button type="button" onClick={() => setEditing(t)} className={estiloDoBotao.secondary}>
                    <Pencil className="size-4" aria-hidden="true" />
                    Editar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ModalPersonalizado isOpen={editing !== null} onClose={() => setEditing(null)} title={editing === "novo" ? "Nova mensagem" : "Editar mensagem"} description="Escrevam o texto e vejam, ao lado, como ele chega no WhatsApp." size="xl" className="max-h-[92dvh] overflow-y-auto">
        {editing !== null ? (
          <FormularioDoEditor
            key={editing === "novo" ? "novo" : editing.id}
            template={editing === "novo" ? null : editing}
            sampleName={sample}
            slug={slug}
            customDomain={customDomain}
            coupleNames={coupleNames}
            onCancel={() => setEditing(null)}
            onSaved={(t, created) => {
              setTemplates((prev) => (created ? [t, ...prev] : prev.map((x) => (x.id === t.id ? t : x))));
              setEditing(null);
            }}
            onDeleted={(id) => {
              setTemplates((prev) => prev.filter((t) => t.id !== id));
              setEditing(null);
            }}
          />
        ) : null}
      </ModalPersonalizado>

      <ModalPersonalizado isOpen={sending !== null} onClose={() => setSending(null)} title={sending ? `Enviar “${sending.name}”` : "Enviar"} description="Escolham quem recebe. O envio usa o texto salvo da mensagem." size="xl" className="max-h-[92dvh] overflow-y-auto">
        {sending ? <FluxoDeEnvio key={sending.id} template={sending} guests={initialGuests} slug={slug} customDomain={customDomain} coupleNames={coupleNames} onDone={() => setSending(null)} /> : null}
      </ModalPersonalizado>
    </div>
  );
}
