"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Eye,
  Plus,
  Trash2,
  Upload,
  Loader2,
  AlertTriangle,
  Check,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { btn } from "@/components/landing/styles";
import { Chip } from "@/components/casal/ui";
import { WeddingSiteView, type WeddingSiteSettings } from "@/components/public/wedding-site-view";
import { readableAccent } from "@/lib/wedding-format";
import { weddingSitePath, weddingSiteUrl } from "@/lib/wedding-links";
import {
  updateSiteCustomization,
  uploadSiteImageAction,
  createStoryItem,
  deleteStoryItem,
  createWeddingTip,
  deleteWeddingTip,
  type SiteCustomizationInput,
} from "@/actions/site-builder-actions";
import { toast } from "sonner";

interface StoryItem {
  id: string;
  title: string;
  dateLabel?: string | null;
  description: string;
  imageUrl?: string | null;
}

interface Tip {
  id: string;
  category: string;
  title: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  linkUrl?: string | null;
  discountCode?: string | null;
}

interface PreviewGift {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  imageUrl?: string | null;
}

interface SiteBuilderClientProps {
  initialSettings: (WeddingSiteSettings & { id?: string }) | null;
  initialStoryItems: StoryItem[];
  initialTips: Tip[];
  previewGifts: PreviewGift[];
  rsvpDeadline: Date | string | null;
  /** Endereço público do casamento (/casamento/<slug>) */
  slug: string;
}

type SectionId = "COVER" | "STORY" | "LOCATION" | "DRESS" | "TIPS" | "RSVP" | "MUSIC" | "GIFTS" | "GUESTBOOK";

/** Seções na ordem em que aparecem no site. `key` liga e desliga a seção no site (a capa está sempre visível). */
const SECTIONS: { id: SectionId; label: string; key?: keyof WeddingSiteSettings; desc?: string }[] = [
  { id: "COVER", label: "Capa" },
  { id: "STORY", label: "Nossa história", key: "showStory", desc: "Mensagem de boas-vindas, foto do casal e momentos marcantes." },
  { id: "LOCATION", label: "Cerimônia e recepção", key: "showLocation", desc: "Endereço, horários e botões de rota (Maps, Waze, Uber)." },
  { id: "DRESS", label: "Traje", key: "showDressCode", desc: "Orientação de traje e cores sugeridas." },
  { id: "TIPS", label: "Dicas aos convidados", key: "showTips", desc: "Hospedagem, beleza e transporte indicados." },
  { id: "RSVP", label: "Confirmação de presença", key: "showRsvp", desc: "Botão e chamada para o convidado confirmar." },
  { id: "MUSIC", label: "Playlist", key: "showMusic", desc: "Link para a playlist do casamento." },
  { id: "GIFTS", label: "Lista de presentes", key: "showGifts", desc: "Presentes em destaque com botão para presentear." },
  { id: "GUESTBOOK", label: "Mural de recados", key: "showGuestbook", desc: "Espaço para os convidados deixarem mensagens." },
];

const TIP_LABELS: Record<string, string> = {
  HOTEL: "Hospedagem",
  SALON: "Beleza",
  TRANSFER: "Transporte",
  DRESS: "Trajes",
};

// Campos que o editor envia ao servidor (o resto do registro é ignorado)
const EDITABLE_KEYS = [
  "title", "subtitle", "weddingDate", "ceremonyTime", "receptionTime", "locationName", "locationAddress",
  "locationMapUrl", "wazeUrl", "uberUrl", "themeColor", "heroImageUrl", "couplePhotoUrl", "dressCodeTitle",
  "dressCodeDesc", "dressCodePalette", "spotifyPlaylistUrl", "welcomeMessage",
  "showStory", "showLocation", "showDressCode", "showTips", "showGifts", "showRsvp", "showGuestbook", "showMusic",
] as const;

function toDateInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function parsePalette(raw?: string | null): string[] {
  try {
    const p = raw ? JSON.parse(raw) : [];
    return Array.isArray(p) ? p.filter((c) => typeof c === "string") : [];
  } catch {
    return [];
  }
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-tinta">
        {label}
      </label>
      {children}
      {hint && <p className="text-sm text-tinta-suave">{hint}</p>}
    </div>
  );
}

const inputClass = "h-11 rounded-xl bg-papel";

const savedFmt = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

/** Uma seção do site: linha de 48px com chip Visível/Oculta que abre os campos da seção. */
function SectionRow({
  id,
  title,
  visible,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  /** undefined: a seção não pode ser ocultada (capa). */
  visible?: boolean;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <li className={`rounded-xl bg-papel ${open ? "border-2 border-ameixa" : "border border-linha"}`}>
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`secao-${id}`}
          onClick={onToggle}
          className="flex min-h-12 w-full cursor-pointer items-center gap-2 rounded-xl px-3 text-left"
        >
          <span className="flex-1 font-semibold text-tinta">{title}</span>
          {visible === undefined ? null : visible ? (
            <Chip tone="sucesso">Visível</Chip>
          ) : (
            <Chip tone="neutro">Oculta</Chip>
          )}
          <ChevronDown aria-hidden="true" className={`size-4 shrink-0 text-tinta-suave transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </h3>
      {open && (
        <div id={`secao-${id}`} className="flex flex-col gap-4 px-3 pb-4 pt-1">
          {children}
        </div>
      )}
    </li>
  );
}

export function SiteBuilderClient({
  initialSettings,
  initialStoryItems,
  initialTips,
  previewGifts,
  rsvpDeadline,
  slug,
}: SiteBuilderClientProps) {
  const [settings, setSettings] = useState<WeddingSiteSettings>(initialSettings ?? {});
  const [storyItems, setStoryItems] = useState<StoryItem[]>(initialStoryItems);
  const [tips, setTips] = useState<Tip[]>(initialTips);
  const [openSection, setOpenSection] = useState<SectionId | null>("COVER");
  const [savedAt, setSavedAt] = useState<string | null>(() => {
    const u = (initialSettings as { updatedAt?: Date | string } | null)?.updatedAt;
    return u ? new Date(u).toISOString() : null;
  });
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState<"heroImageUrl" | "couplePhotoUrl" | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ kind: "story" | "tip"; id: string; title: string } | null>(null);
  const [dirty, setDirty] = useState(false);

  const [story, setStory] = useState({ title: "", dateLabel: "", description: "" });
  const [tip, setTip] = useState({ category: "HOTEL", title: "", description: "", address: "", phone: "", linkUrl: "", discountCode: "" });

  const heroInput = useRef<HTMLInputElement>(null);
  const coupleInput = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<WeddingSiteSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  };

  const palette = parsePalette(settings.dressCodePalette);
  const accent = readableAccent(settings.themeColor || "#5E2B4E");

  const handleSave = () => {
    const payload = Object.fromEntries(
      EDITABLE_KEYS.filter((k) => settings[k] !== undefined).map((k) => [k, settings[k]])
    ) as SiteCustomizationInput;

    const toastId = toast.loading("Salvando o site...");
    startTransition(async () => {
      const res = await updateSiteCustomization(payload);
      if (res.success) {
        setDirty(false);
        setSavedAt(new Date().toISOString());
        toast.success("Site atualizado.", { id: toastId });
      } else {
        toast.error(res.error || "Não foi possível salvar.", { id: toastId });
      }
    });
  };

  const handleUpload = (field: "heroImageUrl" | "couplePhotoUrl", file: File | undefined) => {
    if (!file) return;
    setUploading(field);
    const data = new FormData();
    data.append("image", file);
    startTransition(async () => {
      const res = await uploadSiteImageAction(data);
      setUploading(null);
      if (res.success && res.url) {
        update({ [field]: res.url });
        toast.success("Foto enviada. Salve para publicar.");
      } else {
        toast.error(res.error || "Não foi possível enviar a foto.");
      }
    });
  };

  const handleAddStory = () => {
    if (!story.title.trim() || !story.description.trim()) {
      toast.error("Preencha o título e a descrição do momento.");
      return;
    }
    startTransition(async () => {
      const res = await createStoryItem({ ...story, position: storyItems.length });
      if (res.success && res.item) {
        setStoryItems((prev) => [...prev, res.item as StoryItem]);
        setStory({ title: "", dateLabel: "", description: "" });
        toast.success("Momento adicionado.");
      } else {
        toast.error(res.error || "Não foi possível adicionar o momento.");
      }
    });
  };

  const handleAddTip = () => {
    if (!tip.title.trim()) {
      toast.error("Informe o nome do lugar.");
      return;
    }
    startTransition(async () => {
      const res = await createWeddingTip({ ...tip, position: tips.length });
      if (res.success && res.tip) {
        setTips((prev) => [...prev, res.tip as Tip]);
        setTip({ category: tip.category, title: "", description: "", address: "", phone: "", linkUrl: "", discountCode: "" });
        toast.success("Dica adicionada.");
      } else {
        toast.error(res.error || "Não foi possível adicionar a dica.");
      }
    });
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const { kind, id } = pendingDelete;
    startTransition(async () => {
      const res = kind === "story" ? await deleteStoryItem(id) : await deleteWeddingTip(id);
      if (res.success) {
        if (kind === "story") setStoryItems((prev) => prev.filter((i) => i.id !== id));
        else setTips((prev) => prev.filter((t) => t.id !== id));
        toast.success(kind === "story" ? "Momento removido." : "Dica removida.");
      } else {
        toast.error(res.error || "Não foi possível remover.");
      }
      setPendingDelete(null);
    });
  };

  const toggleBlock = (key: keyof WeddingSiteSettings, checked: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: checked }));
    startTransition(async () => {
      const res = await updateSiteCustomization({ [key]: checked } as SiteCustomizationInput);
      if (res.success) toast.success(checked ? "Seção exibida no site." : "Seção ocultada do site.");
      else {
        setSettings((prev) => ({ ...prev, [key]: !checked }));
        toast.error(res.error || "Não foi possível atualizar a seção.");
      }
    });
  };

  const photoField = (field: "heroImageUrl" | "couplePhotoUrl", label: string, hint: string, ref: React.RefObject<HTMLInputElement | null>) => {
    const url = settings[field];
    return (
      <Field id={field} label={label} hint={hint}>
        <div className="flex items-center gap-3">
          <div className="grid aspect-[3/4] w-[72px] shrink-0 place-items-center overflow-hidden rounded-t-full bg-areia text-center text-[11px] text-tinta-suave">
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt={`Foto atual: ${label.toLowerCase()}`} className="size-full object-cover" />
            ) : (
              <span className="px-1">Sem foto</span>
            )}
          </div>
          <input
            ref={ref}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            aria-label={`Enviar ${label.toLowerCase()}`}
            onChange={(e) => handleUpload(field, e.target.files?.[0])}
          />
          <button type="button" className={`${btn.secondary} ${btn.sm}`} disabled={uploading !== null} onClick={() => ref.current?.click()}>
            {uploading === field ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
            {url ? "Trocar foto" : "Enviar foto"}
          </button>
        </div>
        <Input
          id={field}
          value={url || ""}
          onChange={(e) => update({ [field]: e.target.value })}
          placeholder="Ou cole um link https://..."
          className={inputClass}
        />
      </Field>
    );
  };

  const siteAddress = weddingSiteUrl(slug).replace(/^https?:\/\//, "");

  const preview = (
    <div className="overflow-hidden rounded-2xl bg-linho shadow-[var(--shadow-aceito-2)]">
      <div className="flex h-9 items-center gap-1.5 border-b border-linha bg-papel px-3">
        <span className="size-2.5 rounded-full bg-linha" aria-hidden="true" />
        <span className="size-2.5 rounded-full bg-linha" aria-hidden="true" />
        <span className="size-2.5 rounded-full bg-linha" aria-hidden="true" />
        <span className="ml-3 min-w-0 flex-1 truncate text-xs text-tinta-suave">{siteAddress}</span>
        {dirty && <span className="shrink-0 text-xs font-semibold text-aviso">Alterações não publicadas</span>}
      </div>
      <div className="h-[72vh] overflow-y-auto">
        <div className="pointer-events-none select-none" style={{ zoom: 0.5 }} aria-hidden="true">
          <WeddingSiteView
            slug={slug}
            settings={settings}
            storyItems={storyItems}
            tips={tips}
            guestbookEntries={[]}
            gifts={previewGifts}
            rsvpDeadline={rsvpDeadline}
            preview
          />
        </div>
      </div>
    </div>
  );

  const toggle = (id: SectionId) => setOpenSection((cur) => (cur === id ? null : id));
  const isVisible = (key?: keyof WeddingSiteSettings) => (key ? settings[key] !== false : undefined);

  /** Interruptor de "aparece no site" (publicado na hora, como antes). */
  const visibilityToggle = (key: keyof WeddingSiteSettings, desc?: string) => (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-linho px-3 py-2">
      <div className="min-w-0">
        <label htmlFor={`block-${key}`} className="flex min-h-6 items-center gap-1.5 text-sm font-semibold text-tinta">
          {settings[key] !== false ? <Eye className="size-4" aria-hidden="true" /> : <EyeOff className="size-4" aria-hidden="true" />}
          Mostrar no site
        </label>
        {desc && <p className="text-sm text-tinta-suave">{desc}</p>}
      </div>
      <Switch id={`block-${key}`} checked={settings[key] !== false} onCheckedChange={(checked) => toggleBlock(key, checked)} />
    </div>
  );

  const savedLabel = dirty
    ? "alterações ainda não publicadas"
    : savedAt
      ? `salvo em ${savedFmt.format(new Date(savedAt)).replace(".", "")}`
      : "tudo salvo";

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center gap-3 rounded-2xl border border-linha bg-papel px-4 py-3 shadow-[var(--shadow-aceito-1)]">
        <Link href="/dashboard" aria-label="Voltar ao painel" className="grid size-11 shrink-0 place-items-center rounded-xl text-tinta hover:bg-ameixa-suave">
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
        <div className="flex min-w-0 flex-1 basis-48 flex-col">
          <h1 className="font-semibold text-tinta">Editar o site</h1>
          <span className="truncate text-sm text-tinta-suave" aria-live="polite">
            {siteAddress} · {savedLabel}
          </span>
        </div>
        <Link href={weddingSitePath(slug)} target="_blank" className={`${btn.secondary} ${btn.sm}`}>
          <Eye className="size-4" aria-hidden="true" /> Ver o site
        </Link>
        <button type="button" onClick={handleSave} disabled={isPending || !dirty} className={`${btn.primary} ${btn.sm}`}>
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : dirty ? null : <Check className="size-4" aria-hidden="true" />}
          {dirty ? "Publicar alterações" : "Tudo publicado"}
        </button>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(340px,420px)_minmax(0,1fr)] xl:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          <ol className="flex flex-col gap-1.5">
            {SECTIONS.map((section) => (
              <SectionRow
                key={section.id}
                id={section.id}
                title={section.label}
                visible={isVisible(section.key)}
                open={openSection === section.id}
                onToggle={() => toggle(section.id)}
              >
                {section.id === "COVER" && (
                  <>
                    <Field id="title" label="Nomes do casal">
                      <Input id="title" value={settings.title || ""} onChange={(e) => update({ title: e.target.value })} placeholder="Ana & Pedro" className={`${inputClass} text-base font-semibold`} />
                    </Field>
                    <Field id="weddingDate" label="Data do casamento">
                      <DatePicker
                        id="weddingDate"
                        value={toDateInput(settings.weddingDate)}
                        onChange={(e) => update({ weddingDate: e.target.value ? `${e.target.value}T12:00:00.000Z` : null })}
                      />
                    </Field>
                    <Field id="subtitle" label="Frase acima dos nomes" hint="Opcional. Ex.: “Vamos nos casar!”">
                      <Input id="subtitle" value={settings.subtitle || ""} onChange={(e) => update({ subtitle: e.target.value })} className={inputClass} />
                    </Field>
                    <Field id="themeColor" label="Cor do site">
                      <div className="flex items-center gap-2">
                        <input
                          id="themeColor"
                          type="color"
                          value={settings.themeColor || "#5E2B4E"}
                          onChange={(e) => update({ themeColor: e.target.value })}
                          className="h-11 w-14 cursor-pointer rounded-xl border border-linha-forte bg-papel p-1"
                          aria-describedby="themeColor-hint"
                        />
                        <Input
                          aria-label="Código da cor"
                          value={settings.themeColor || ""}
                          onChange={(e) => update({ themeColor: e.target.value })}
                          className={`${inputClass} font-mono uppercase`}
                          maxLength={7}
                        />
                      </div>
                      <p id="themeColor-hint" className="flex items-start gap-1.5 text-sm text-tinta-suave">
                        {accent.adjusted ? (
                          <>
                            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-aviso" aria-hidden="true" />
                            Cor clara demais para texto: o site usa um tom mais escuro para manter a leitura.
                          </>
                        ) : (
                          "Usada em botões, títulos e detalhes do site."
                        )}
                      </p>
                    </Field>
                    {photoField("heroImageUrl", "Foto da capa", "Aparece em um arco vertical no topo do site. Prefira uma foto em pé, com vocês no centro. JPG, PNG ou WEBP de até 5 MB.", heroInput)}
                  </>
                )}

                {section.id === "STORY" && section.key && (
                  <>
                    {visibilityToggle(section.key, section.desc)}
                    <Field id="welcomeMessage" label="Mensagem de boas-vindas">
                      <Textarea id="welcomeMessage" rows={3} value={settings.welcomeMessage || ""} onChange={(e) => update({ welcomeMessage: e.target.value })} className="rounded-xl bg-papel" />
                    </Field>
                    {photoField("couplePhotoUrl", "Foto do casal", "Aparece na seção “Nossa história”.", coupleInput)}

                    <fieldset className="flex flex-col gap-3 rounded-xl border border-linha p-3">
                      <legend className="px-1 text-sm font-semibold text-tinta">Novo momento</legend>
                      <Field id="story-title" label="Título">
                        <Input id="story-title" value={story.title} onChange={(e) => setStory({ ...story, title: e.target.value })} placeholder="O primeiro encontro" className={inputClass} />
                      </Field>
                      <Field id="story-date" label="Quando">
                        <Input id="story-date" value={story.dateLabel} onChange={(e) => setStory({ ...story, dateLabel: e.target.value })} placeholder="Outubro de 2021" className={inputClass} />
                      </Field>
                      <Field id="story-desc" label="O que aconteceu">
                        <Textarea id="story-desc" rows={3} value={story.description} onChange={(e) => setStory({ ...story, description: e.target.value })} className="rounded-xl bg-papel" />
                      </Field>
                      <button type="button" onClick={handleAddStory} disabled={isPending} className={`${btn.secondary} ${btn.sm} w-fit`}>
                        <Plus className="size-4" aria-hidden="true" /> Adicionar momento
                      </button>
                    </fieldset>
                    <ItemList
                      title={`Momentos publicados (${storyItems.length})`}
                      empty="Nenhum momento ainda. A seção mostra só a mensagem e a foto do casal."
                      items={storyItems.map((i) => ({ id: i.id, eyebrow: i.dateLabel, title: i.title, text: i.description }))}
                      onDelete={(item) => setPendingDelete({ kind: "story", id: item.id, title: item.title })}
                    />
                  </>
                )}

                {section.id === "LOCATION" && section.key && (
                  <>
                    {visibilityToggle(section.key)}
                    <p className="text-sm text-tinta-suave">Se você não informar os links de rota, o site cria os botões a partir do endereço.</p>
                    <Field id="locationName" label="Nome do local">
                      <Input id="locationName" value={settings.locationName || ""} onChange={(e) => update({ locationName: e.target.value })} className={inputClass} />
                    </Field>
                    <Field id="locationAddress" label="Endereço completo">
                      <Input id="locationAddress" value={settings.locationAddress || ""} onChange={(e) => update({ locationAddress: e.target.value })} className={inputClass} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field id="ceremonyTime" label="Horário da cerimônia">
                        <Input id="ceremonyTime" type="time" value={settings.ceremonyTime || ""} onChange={(e) => update({ ceremonyTime: e.target.value })} className={inputClass} />
                      </Field>
                      <Field id="receptionTime" label="Horário da recepção">
                        <Input id="receptionTime" type="time" value={settings.receptionTime || ""} onChange={(e) => update({ receptionTime: e.target.value })} className={inputClass} />
                      </Field>
                    </div>
                    <Field id="locationMapUrl" label="Link do Google Maps" hint="Opcional">
                      <Input id="locationMapUrl" value={settings.locationMapUrl || ""} onChange={(e) => update({ locationMapUrl: e.target.value })} placeholder="https://maps.app.goo.gl/..." className={inputClass} />
                    </Field>
                    <Field id="wazeUrl" label="Link do Waze" hint="Opcional">
                      <Input id="wazeUrl" value={settings.wazeUrl || ""} onChange={(e) => update({ wazeUrl: e.target.value })} placeholder="https://waze.com/ul/..." className={inputClass} />
                    </Field>
                    <Field id="uberUrl" label="Link do Uber" hint="Opcional">
                      <Input id="uberUrl" value={settings.uberUrl || ""} onChange={(e) => update({ uberUrl: e.target.value })} placeholder="https://m.uber.com/ul/..." className={inputClass} />
                    </Field>
                  </>
                )}

                {section.id === "DRESS" && section.key && (
                  <>
                    {visibilityToggle(section.key, section.desc)}
                    <Field id="dressCodeTitle" label="Tipo de traje">
                      <Input id="dressCodeTitle" value={settings.dressCodeTitle || ""} onChange={(e) => update({ dressCodeTitle: e.target.value })} placeholder="Passeio completo" className={inputClass} />
                    </Field>
                    <Field id="dressCodeDesc" label="Orientações">
                      <Textarea id="dressCodeDesc" rows={3} value={settings.dressCodeDesc || ""} onChange={(e) => update({ dressCodeDesc: e.target.value })} className="rounded-xl bg-papel" />
                    </Field>
                    <fieldset className="flex flex-col gap-2">
                      <legend className="text-sm font-semibold text-tinta">Cores sugeridas</legend>
                      <div className="flex flex-wrap items-center gap-3">
                        {palette.map((color, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <input
                              type="color"
                              value={color}
                              aria-label={`Cor ${i + 1}`}
                              onChange={(e) => {
                                const next = [...palette];
                                next[i] = e.target.value;
                                update({ dressCodePalette: JSON.stringify(next) });
                              }}
                              className="size-11 cursor-pointer rounded-full border border-linha-forte bg-papel p-0.5"
                            />
                            <button
                              type="button"
                              aria-label={`Remover cor ${i + 1}`}
                              onClick={() => update({ dressCodePalette: JSON.stringify(palette.filter((_, j) => j !== i)) })}
                              className="grid size-11 place-items-center rounded-full text-tinta-suave hover:bg-perigo-suave hover:text-perigo"
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </button>
                          </div>
                        ))}
                        {palette.length < 6 && (
                          <button type="button" className={`${btn.secondary} ${btn.sm}`} onClick={() => update({ dressCodePalette: JSON.stringify([...palette, "#C5A880"]) })}>
                            <Plus className="size-4" aria-hidden="true" /> Adicionar cor
                          </button>
                        )}
                      </div>
                    </fieldset>
                  </>
                )}

                {section.id === "TIPS" && section.key && (
                  <>
                    {visibilityToggle(section.key, section.desc)}
                    <fieldset className="flex flex-col gap-3 rounded-xl border border-linha p-3">
                      <legend className="px-1 text-sm font-semibold text-tinta">Nova dica</legend>
                      <Field id="tip-category" label="Categoria">
                        <Select value={tip.category} onValueChange={(v) => setTip({ ...tip, category: v })}>
                          <SelectTrigger id="tip-category" className="h-11 w-full rounded-xl bg-papel">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(TIP_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field id="tip-title" label="Nome do lugar">
                        <Input id="tip-title" value={tip.title} onChange={(e) => setTip({ ...tip, title: e.target.value })} className={inputClass} />
                      </Field>
                      <Field id="tip-address" label="Endereço">
                        <Input id="tip-address" value={tip.address} onChange={(e) => setTip({ ...tip, address: e.target.value })} className={inputClass} />
                      </Field>
                      <Field id="tip-phone" label="Telefone">
                        <Input id="tip-phone" value={tip.phone} onChange={(e) => setTip({ ...tip, phone: e.target.value })} className={inputClass} />
                      </Field>
                      <Field id="tip-link" label="Site ou link de reserva">
                        <Input id="tip-link" value={tip.linkUrl} onChange={(e) => setTip({ ...tip, linkUrl: e.target.value })} placeholder="https://..." className={inputClass} />
                      </Field>
                      <Field id="tip-discount" label="Cupom de desconto">
                        <Input id="tip-discount" value={tip.discountCode} onChange={(e) => setTip({ ...tip, discountCode: e.target.value.toUpperCase() })} className={`${inputClass} font-semibold uppercase`} />
                      </Field>
                      <Field id="tip-desc" label="Descrição">
                        <Textarea id="tip-desc" rows={2} value={tip.description} onChange={(e) => setTip({ ...tip, description: e.target.value })} className="rounded-xl bg-papel" />
                      </Field>
                      <button type="button" onClick={handleAddTip} disabled={isPending} className={`${btn.secondary} ${btn.sm} w-fit`}>
                        <Plus className="size-4" aria-hidden="true" /> Adicionar dica
                      </button>
                    </fieldset>
                    <ItemList
                      title={`Dicas publicadas (${tips.length})`}
                      empty="Nenhuma dica ainda. A seção só aparece no site quando houver pelo menos uma."
                      items={tips.map((t) => ({ id: t.id, eyebrow: TIP_LABELS[t.category] ?? t.category, title: t.title, text: t.discountCode ? `Cupom ${t.discountCode}` : t.description }))}
                      onDelete={(item) => setPendingDelete({ kind: "tip", id: item.id, title: item.title })}
                    />
                  </>
                )}

                {section.id === "MUSIC" && section.key && (
                  <>
                    {visibilityToggle(section.key, section.desc)}
                    <Field id="spotifyPlaylistUrl" label="Link da playlist">
                      <Input
                        id="spotifyPlaylistUrl"
                        value={settings.spotifyPlaylistUrl || ""}
                        onChange={(e) => update({ spotifyPlaylistUrl: e.target.value })}
                        placeholder="https://open.spotify.com/playlist/..."
                        className={inputClass}
                      />
                    </Field>
                  </>
                )}

                {(section.id === "RSVP" || section.id === "GIFTS" || section.id === "GUESTBOOK") && section.key && visibilityToggle(section.key, section.desc)}
              </SectionRow>
            ))}
          </ol>
          <p className="text-sm text-tinta-suave">
            Ligar ou desligar uma seção vale na hora. Os textos e as fotos só vão para o site quando você toca em “Publicar alterações”.
          </p>

          {/* Prévia abaixo do formulário em telas menores */}
          <details className="xl:hidden">
            <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-ameixa">Mostrar prévia do site</summary>
            <div className="mt-3">{preview}</div>
          </details>
        </div>

        <div className="sticky top-4 hidden min-w-0 rounded-2xl bg-areia p-4 xl:block 2xl:p-6">
          <p className="mb-3 text-sm font-semibold text-tinta-suave">Prévia ao vivo</p>
          {preview}
        </div>
      </div>

      <ConfirmModal
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        isLoading={isPending}
        title={pendingDelete?.kind === "story" ? "Remover momento?" : "Remover dica?"}
        description={`“${pendingDelete?.title ?? ""}” deixa de aparecer no site.`}
        confirmText="Remover"
      />
    </div>
  );
}

function ItemList({
  title,
  empty,
  items,
  onDelete,
}: {
  title: string;
  empty: string;
  items: { id: string; eyebrow?: string | null; title: string; text?: string | null }[];
  onDelete: (item: { id: string; title: string }) => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h4 className="text-sm font-semibold text-tinta">{title}</h4>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-linha-forte bg-linho p-3 text-sm text-tinta-suave">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-linha bg-papel p-3">
              <div className="min-w-0">
                {item.eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">{item.eyebrow}</p>}
                <p className="truncate font-semibold text-tinta">{item.title}</p>
                {item.text && <p className="line-clamp-2 text-sm text-tinta-suave">{item.text}</p>}
              </div>
              <Button
                aria-label={`Remover ${item.title}`}
                variant="ghost"
                size="icon"
                onClick={() => onDelete(item)}
                className="size-11 shrink-0 rounded-xl text-tinta-suave hover:bg-perigo-suave hover:text-perigo"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
