"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import {
  MapPin,
  Heart,
  Eye,
  Plus,
  Trash2,
  Save,
  Layers,
  Shirt,
  BookOpen,
  Sparkles,
  Upload,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/admin/page-header";
import { WeddingSiteView, type WeddingSiteSettings } from "@/components/public/wedding-site-view";
import { readableAccent } from "@/lib/wedding-format";
import { weddingSitePath } from "@/lib/wedding-links";
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

type TabId = "GENERAL" | "LOCATION" | "DRESS" | "STORY" | "TIPS" | "BLOCKS";

const TABS: { id: TabId; label: string; icon: typeof Heart }[] = [
  { id: "GENERAL", label: "Capa e textos", icon: Heart },
  { id: "LOCATION", label: "Local", icon: MapPin },
  { id: "DRESS", label: "Traje", icon: Shirt },
  { id: "STORY", label: "Nossa história", icon: BookOpen },
  { id: "TIPS", label: "Dicas", icon: Sparkles },
  { id: "BLOCKS", label: "Seções", icon: Layers },
];

const BLOCKS: { key: keyof WeddingSiteSettings; label: string; desc: string }[] = [
  { key: "showStory", label: "Nossa história", desc: "Mensagem de boas-vindas, foto do casal e momentos marcantes" },
  { key: "showLocation", label: "Local e horários", desc: "Endereço, horários e botões de rota (Maps, Waze, Uber)" },
  { key: "showDressCode", label: "Traje", desc: "Orientação de traje e cores sugeridas" },
  { key: "showTips", label: "Dicas aos convidados", desc: "Hospedagem, beleza e transporte indicados" },
  { key: "showRsvp", label: "Confirmação de presença", desc: "Botão e chamada para o convidado confirmar" },
  { key: "showMusic", label: "Playlist", desc: "Link para a playlist do casamento" },
  { key: "showGuestbook", label: "Mural de recados", desc: "Espaço para os convidados deixarem mensagens" },
  { key: "showGifts", label: "Lista de presentes", desc: "Presentes em destaque com botão para presentear" },
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
      <label htmlFor={id} className="text-sm font-semibold text-tinta-suave">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-tinta-suave">{hint}</p>}
    </div>
  );
}

function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-linha/80 bg-papel p-5 shadow-sm sm:p-6">
      <div>
        <h2 className="font-serif text-xl font-semibold text-tinta">{title}</h2>
        {description && <p className="mt-1 text-sm text-tinta-suave">{description}</p>}
      </div>
      {children}
    </section>
  );
}

const inputClass = "h-11 rounded-xl bg-linho/50";

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
  const [activeTab, setActiveTab] = useState<TabId>("GENERAL");
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

  const photoField = (field: "heroImageUrl" | "couplePhotoUrl", label: string, hint: string, ref: React.RefObject<HTMLInputElement | null>) => (
    <Field id={field} label={label} hint={hint}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id={field}
          value={settings[field] || ""}
          onChange={(e) => update({ [field]: e.target.value })}
          placeholder="https://..."
          className={`${inputClass} flex-1`}
        />
        <input
          ref={ref}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={(e) => handleUpload(field, e.target.files?.[0])}
        />
        <Button type="button" variant="outline" className="h-11 gap-2 rounded-xl" disabled={uploading !== null} onClick={() => ref.current?.click()}>
          {uploading === field ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
          Enviar foto
        </Button>
      </div>
    </Field>
  );

  const preview = (
    <div className="overflow-hidden rounded-2xl border border-linha bg-papel shadow-sm">
      <div className="flex items-center justify-between border-b border-linha bg-linho px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-tinta-suave">Prévia ao vivo</span>
        {dirty && <span className="text-xs font-semibold text-aviso">Alterações não salvas</span>}
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Site do casal"
        description="Edite os textos, fotos e seções do site. A prévia mostra o resultado enquanto você digita."
        actions={
          <>
            <Button asChild variant="outline" className="h-11 gap-2 rounded-full border-linha px-5">
              <Link href={weddingSitePath(slug)} target="_blank">
                <Eye className="h-4 w-4" aria-hidden="true" /> Ver site publicado
              </Link>
            </Button>
            <Button onClick={handleSave} disabled={isPending || !dirty} className="h-11 gap-2 rounded-full px-6">
              <Save className="h-4 w-4" aria-hidden="true" /> {dirty ? "Salvar alterações" : "Tudo salvo"}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          <div role="tablist" aria-label="Partes do site" className="flex gap-2 overflow-x-auto pb-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    active ? "bg-brand text-white" : "border border-linha bg-papel text-tinta-suave hover:bg-linho"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === "GENERAL" && (
            <>
              <Panel title="Identidade do casal" description="Aparece na capa do site, no painel e nas páginas dos convidados.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="title" label="Nomes do casal">
                    <Input id="title" value={settings.title || ""} onChange={(e) => update({ title: e.target.value })} placeholder="Ana & Pedro" className={`${inputClass} font-serif text-base font-semibold`} />
                  </Field>
                  <Field id="weddingDate" label="Data do casamento">
                    <DatePicker
                      id="weddingDate"
                      value={toDateInput(settings.weddingDate)}
                      onChange={(e) => update({ weddingDate: e.target.value ? `${e.target.value}T12:00:00.000Z` : null })}
                    />
                  </Field>
                  <Field id="subtitle" label="Frase da capa" hint="Opcional. Ex.: “Vamos nos casar!”">
                    <Input id="subtitle" value={settings.subtitle || ""} onChange={(e) => update({ subtitle: e.target.value })} className={inputClass} />
                  </Field>
                  <Field id="themeColor" label="Cor do site">
                    <div className="flex items-center gap-2">
                      <input
                        id="themeColor"
                        type="color"
                        value={settings.themeColor || "#5E2B4E"}
                        onChange={(e) => update({ themeColor: e.target.value })}
                        className="h-11 w-14 cursor-pointer rounded-xl border border-linha bg-papel p-1"
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
                    <p id="themeColor-hint" className="flex items-center gap-1.5 text-xs text-tinta-suave">
                      {accent.adjusted ? (
                        <>
                          <AlertTriangle className="h-3.5 w-3.5 text-aviso" aria-hidden="true" />
                          Cor clara demais para texto: o site usa um tom mais escuro para manter a leitura.
                        </>
                      ) : (
                        "Usada em botões, títulos e detalhes do site."
                      )}
                    </p>
                  </Field>
                </div>
                <Field id="welcomeMessage" label="Mensagem de boas-vindas">
                  <Textarea id="welcomeMessage" rows={3} value={settings.welcomeMessage || ""} onChange={(e) => update({ welcomeMessage: e.target.value })} className="rounded-xl bg-linho/50" />
                </Field>
              </Panel>

              <Panel title="Fotos" description="JPG, PNG ou WEBP de até 5 MB. Você também pode colar um link.">
                {photoField("heroImageUrl", "Foto da capa", "Fica atrás dos nomes, no topo do site. Prefira fotos na horizontal.", heroInput)}
                {photoField("couplePhotoUrl", "Foto do casal", "Aparece na seção “Nossa história”.", coupleInput)}
              </Panel>
            </>
          )}

          {activeTab === "LOCATION" && (
            <Panel title="Local e horários" description="Se você não informar os links de rota, o site cria os botões a partir do endereço.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="locationName" label="Nome do local">
                  <Input id="locationName" value={settings.locationName || ""} onChange={(e) => update({ locationName: e.target.value })} className={inputClass} />
                </Field>
                <Field id="locationAddress" label="Endereço completo">
                  <Input id="locationAddress" value={settings.locationAddress || ""} onChange={(e) => update({ locationAddress: e.target.value })} className={inputClass} />
                </Field>
                <Field id="ceremonyTime" label="Horário da cerimônia">
                  <Input id="ceremonyTime" type="time" value={settings.ceremonyTime || ""} onChange={(e) => update({ ceremonyTime: e.target.value })} className={inputClass} />
                </Field>
                <Field id="receptionTime" label="Horário da recepção">
                  <Input id="receptionTime" type="time" value={settings.receptionTime || ""} onChange={(e) => update({ receptionTime: e.target.value })} className={inputClass} />
                </Field>
                <Field id="locationMapUrl" label="Link do Google Maps" hint="Opcional">
                  <Input id="locationMapUrl" value={settings.locationMapUrl || ""} onChange={(e) => update({ locationMapUrl: e.target.value })} placeholder="https://maps.app.goo.gl/..." className={inputClass} />
                </Field>
                <Field id="wazeUrl" label="Link do Waze" hint="Opcional">
                  <Input id="wazeUrl" value={settings.wazeUrl || ""} onChange={(e) => update({ wazeUrl: e.target.value })} placeholder="https://waze.com/ul/..." className={inputClass} />
                </Field>
                <Field id="uberUrl" label="Link do Uber" hint="Opcional">
                  <Input id="uberUrl" value={settings.uberUrl || ""} onChange={(e) => update({ uberUrl: e.target.value })} placeholder="https://m.uber.com/ul/..." className={inputClass} />
                </Field>
              </div>
            </Panel>
          )}

          {activeTab === "DRESS" && (
            <Panel title="Traje" description="Oriente os convidados sobre o traje e as cores.">
              <Field id="dressCodeTitle" label="Tipo de traje">
                <Input id="dressCodeTitle" value={settings.dressCodeTitle || ""} onChange={(e) => update({ dressCodeTitle: e.target.value })} placeholder="Passeio completo" className={inputClass} />
              </Field>
              <Field id="dressCodeDesc" label="Orientações">
                <Textarea id="dressCodeDesc" rows={3} value={settings.dressCodeDesc || ""} onChange={(e) => update({ dressCodeDesc: e.target.value })} className="rounded-xl bg-linho/50" />
              </Field>
              <fieldset className="flex flex-col gap-2">
                <legend className="text-sm font-semibold text-tinta-suave">Cores sugeridas</legend>
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
                        className="h-10 w-10 cursor-pointer rounded-full border border-linha bg-papel p-0.5"
                      />
                      <button
                        type="button"
                        aria-label={`Remover cor ${i + 1}`}
                        onClick={() => update({ dressCodePalette: JSON.stringify(palette.filter((_, j) => j !== i)) })}
                        className="rounded-full p-1 text-tinta-suave hover:bg-areia hover:text-perigo"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                  {palette.length < 6 && (
                    <Button type="button" variant="outline" size="sm" className="gap-1 rounded-full" onClick={() => update({ dressCodePalette: JSON.stringify([...palette, "#C5A880"]) })}>
                      <Plus className="h-4 w-4" aria-hidden="true" /> Adicionar cor
                    </Button>
                  )}
                </div>
              </fieldset>
            </Panel>
          )}

          {activeTab === "STORY" && (
            <>
              <Panel title="Novo momento" description="Momentos aparecem em ordem na seção “Nossa história”.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="story-title" label="Título">
                    <Input id="story-title" value={story.title} onChange={(e) => setStory({ ...story, title: e.target.value })} placeholder="O primeiro encontro" className={inputClass} />
                  </Field>
                  <Field id="story-date" label="Quando">
                    <Input id="story-date" value={story.dateLabel} onChange={(e) => setStory({ ...story, dateLabel: e.target.value })} placeholder="Outubro de 2021" className={inputClass} />
                  </Field>
                </div>
                <Field id="story-desc" label="O que aconteceu">
                  <Textarea id="story-desc" rows={3} value={story.description} onChange={(e) => setStory({ ...story, description: e.target.value })} className="rounded-xl bg-linho/50" />
                </Field>
                <Button onClick={handleAddStory} disabled={isPending} className="w-fit gap-2 rounded-full">
                  <Plus className="h-4 w-4" aria-hidden="true" /> Adicionar momento
                </Button>
              </Panel>

              <ItemList
                title={`Momentos publicados (${storyItems.length})`}
                empty="Nenhum momento ainda. A seção mostra só a mensagem e a foto do casal."
                items={storyItems.map((i) => ({ id: i.id, eyebrow: i.dateLabel, title: i.title, text: i.description }))}
                onDelete={(item) => setPendingDelete({ kind: "story", id: item.id, title: item.title })}
              />
            </>
          )}

          {activeTab === "TIPS" && (
            <>
              <Panel title="Nova dica" description="Hotéis, salões e transporte que vocês indicam aos convidados.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="tip-category" label="Categoria">
                    <Select value={tip.category} onValueChange={(v) => setTip({ ...tip, category: v })}>
                      <SelectTrigger id="tip-category" className="h-11 w-full rounded-xl bg-linho/50">
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
                </div>
                <Field id="tip-desc" label="Descrição">
                  <Textarea id="tip-desc" rows={2} value={tip.description} onChange={(e) => setTip({ ...tip, description: e.target.value })} className="rounded-xl bg-linho/50" />
                </Field>
                <Button onClick={handleAddTip} disabled={isPending} className="w-fit gap-2 rounded-full">
                  <Plus className="h-4 w-4" aria-hidden="true" /> Adicionar dica
                </Button>
              </Panel>

              <ItemList
                title={`Dicas publicadas (${tips.length})`}
                empty="Nenhuma dica ainda. A seção só aparece no site quando houver pelo menos uma."
                items={tips.map((t) => ({ id: t.id, eyebrow: TIP_LABELS[t.category] ?? t.category, title: t.title, text: t.discountCode ? `Cupom ${t.discountCode}` : t.description }))}
                onDelete={(item) => setPendingDelete({ kind: "tip", id: item.id, title: item.title })}
              />
            </>
          )}

          {activeTab === "BLOCKS" && (
            <Panel title="Seções do site" description="Escolha o que aparece para os convidados. As mudanças são publicadas na hora.">
              <ul className="divide-y divide-linha">
                {BLOCKS.map((block) => (
                  <li key={block.key} className="flex items-center justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <label htmlFor={`block-${block.key}`} className="text-sm font-semibold text-tinta">
                        {block.label}
                      </label>
                      <p className="text-sm text-tinta-suave">{block.desc}</p>
                      {block.key === "showMusic" && (
                        <Input
                          aria-label="Link da playlist"
                          value={settings.spotifyPlaylistUrl || ""}
                          onChange={(e) => update({ spotifyPlaylistUrl: e.target.value })}
                          placeholder="https://open.spotify.com/playlist/..."
                          className={`${inputClass} mt-2`}
                        />
                      )}
                    </div>
                    <Switch
                      id={`block-${block.key}`}
                      checked={settings[block.key] !== false}
                      onCheckedChange={(checked) => toggleBlock(block.key, checked)}
                    />
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {/* Prévia abaixo do formulário em telas menores */}
          <details className="xl:hidden">
            <summary className="cursor-pointer text-sm font-semibold text-brand-600">Mostrar prévia do site</summary>
            <div className="mt-3">{preview}</div>
          </details>
        </div>

        <div className="sticky top-4 hidden min-w-0 xl:block">{preview}</div>
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
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-tinta-suave">{title}</h3>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-linha bg-papel p-5 text-sm text-tinta-suave">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-linha bg-papel p-4">
              <div className="min-w-0">
                {item.eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{item.eyebrow}</p>}
                <p className="truncate font-serif text-base font-semibold text-tinta">{item.title}</p>
                {item.text && <p className="line-clamp-2 text-sm text-tinta-suave">{item.text}</p>}
              </div>
              <Button
                aria-label={`Remover ${item.title}`}
                variant="ghost"
                size="icon"
                onClick={() => onDelete(item)}
                className="h-9 w-9 shrink-0 rounded-full text-tinta-suave hover:bg-perigo-suave hover:text-perigo"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
