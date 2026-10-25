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
  AlertTriangle,
  Check,
  EyeOff,
} from "lucide-react";
import { Botao } from "@/components/ui/button";
import { Entrada } from "@/components/ui/input";
import { AreaDeTexto } from "@/components/ui/textarea";
import { Interruptor } from "@/components/ui/switch";
import { SeletorDeData } from "@/components/ui/date-picker";
import { ModalDeConfirmacao } from "@/components/ui/confirm-modal";
import { Selecao, ConteudoDaSelecao, ItemDaSelecao, GatilhoDaSelecao, ValorDaSelecao } from "@/components/ui/select";
import { estiloDoBotao } from "@/components/landing/styles";
import { BotaoComCarregamento } from "@/components/painel/loading-button";
import { Esqueleto } from "@/components/ui/skeleton";
import { ImagemDaPessoa } from "@/components/ui/user-image";
import { Etiqueta } from "@/components/casal/ui";
import { EscopoClaro } from "@/components/theme/light-scope";
import { VisaoDoSiteDoCasamento } from "@/components/public/site-do-casamento/visao-do-site";
import type { ConfiguracoesDoSiteDoCasamento } from "@/components/public/site-do-casamento/tipos";
import { destaqueLegivel } from "@/lib/wedding-format";
import { caminhoDoSiteDoCasamento, urlDoSiteDoCasamento } from "@/lib/wedding-links";
import {
  atualizarPersonalizacaoDoSite,
  enviarImagemDoSite,
  criarItemDaHistoria,
  excluirItemDaHistoria,
  criarDicaDoCasamento,
  excluirDicaDoCasamento,
  type EntradaDaPersonalizacaoDoSite,
} from "@/actions/site-builder-actions";
import { toast } from "sonner";

interface ItemDaHistoria {
  id: string;
  title: string;
  dateLabel?: string | null;
  description: string;
  imageUrl?: string | null;
}

interface Dica {
  id: string;
  category: string;
  title: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  linkUrl?: string | null;
  discountCode?: string | null;
}

interface PresenteDaPrevia {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  imageUrl?: string | null;
}

interface PropriedadesDoEditorDoSiteCliente {
  initialSettings: (ConfiguracoesDoSiteDoCasamento & { id?: string }) | null;
  initialStoryItems: ItemDaHistoria[];
  initialTips: Dica[];
  previewGifts: PresenteDaPrevia[];
  rsvpDeadline: Date | string | null;
  /** Endereço público do casamento (/casamento/<slug>) */
  slug: string;
  /** Domínio próprio conectado (aparece como endereço do site) */
  customDomain?: string | null;
}

type IdDaSecao = "COVER" | "STORY" | "LOCATION" | "DRESS" | "TIPS" | "RSVP" | "MUSIC" | "GIFTS" | "GUESTBOOK";

/** Seções na ordem em que aparecem no site. `key` liga e desliga a seção no site (a capa está sempre visível). */
const SECOES: { id: IdDaSecao; label: string; key?: keyof ConfiguracoesDoSiteDoCasamento; desc?: string }[] = [
  { id: "COVER", label: "Capa" },
  { id: "STORY", label: "Nossa história", key: "showStory", desc: "Mensagem de boas-vindas, foto do casal e momentos marcantes." },
  { id: "LOCATION", label: "Cerimônia e recepção", key: "showLocation", desc: "Endereço, horários e botões de rota (Maps, Waze, Uber)." },
  { id: "DRESS", label: "Traje", key: "showDressCode", desc: "Orientação de traje e cores sugeridas." },
  { id: "TIPS", label: "Dicas aos convidados", key: "showTips", desc: "Hospedagem, beleza e transporte indicados." },
  { id: "RSVP", label: "Confirmação de presença", key: "showRsvp", desc: "Botão e chamada para o convidado confirmar." },
  { id: "MUSIC", label: "Playlist", key: "showMusic", desc: "Link para a playlist do casamento." },
  { id: "GIFTS", label: "Presentes em dinheiro", key: "showGifts", desc: "Presentes em destaque, com botão para o convidado presentear por Pix ou cartão." },
  { id: "GUESTBOOK", label: "Mural de recados", key: "showGuestbook", desc: "Espaço para os convidados deixarem mensagens." },
];

const ROTULOS_DAS_DICAS: Record<string, string> = {
  HOTEL: "Hospedagem",
  SALON: "Beleza",
  TRANSFER: "Transporte",
  DRESS: "Trajes",
};

// Campos que o editor envia ao servidor (o resto do registro é ignorado)
const CHAVES_EDITAVEIS = [
  "title", "subtitle", "weddingDate", "ceremonyTime", "receptionTime", "locationName", "locationAddress",
  "locationMapUrl", "wazeUrl", "uberUrl", "themeColor", "heroImageUrl", "couplePhotoUrl", "dressCodeTitle",
  "dressCodeDesc", "dressCodePalette", "spotifyPlaylistUrl", "welcomeMessage",
  "showStory", "showLocation", "showDressCode", "showTips", "showGifts", "showRsvp", "showGuestbook", "showMusic",
] as const;

function paraCampoDeData(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function interpretarPaleta(raw?: string | null): string[] {
  try {
    const p = raw ? JSON.parse(raw) : [];
    return Array.isArray(p) ? p.filter((c) => typeof c === "string") : [];
  } catch {
    return [];
  }
}

/** Rótulo fixo para controles que não são campo de texto (seletor de cor e envio de foto). */
function CampoDoEditor({ id, label, hint, group, children }: { id: string; label: string; hint?: string; group?: boolean; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5" {...(group ? { role: "group", "aria-labelledby": `${id}-rotulo` } : {})}>
      {group ? (
        <span id={`${id}-rotulo`} className="text-sm font-semibold text-tinta">
          {label}
        </span>
      ) : (
        <label htmlFor={id} className="text-sm font-semibold text-tinta">
          {label}
        </label>
      )}
      {children}
      {hint && <p className="text-sm text-tinta-suave">{hint}</p>}
    </div>
  );
}


const formatoDoSalvo = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

/** Uma seção do site: linha de 48px com chip Visível/Oculta que abre os campos da seção. */
function LinhaDaSecao({
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
            <Etiqueta tone="sucesso">Visível</Etiqueta>
          ) : (
            <Etiqueta tone="neutro">Oculta</Etiqueta>
          )}
          <ChevronDown aria-hidden="true" className={`size-4 shrink-0 text-tinta-suave transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </h3>
      {open && (
        <div id={`secao-${id}`} className="flex flex-col gap-5 px-3 pb-4 pt-3">
          {children}
        </div>
      )}
    </li>
  );
}

export function EditorDoSiteCliente({
  initialSettings,
  initialStoryItems,
  initialTips,
  previewGifts,
  rsvpDeadline,
  slug,
  customDomain,
}: PropriedadesDoEditorDoSiteCliente) {
  const [settings, setSettings] = useState<ConfiguracoesDoSiteDoCasamento>(initialSettings ?? {});
  const [storyItems, setStoryItems] = useState<ItemDaHistoria[]>(initialStoryItems);
  const [tips, setTips] = useState<Dica[]>(initialTips);
  const [openSection, setOpenSection] = useState<IdDaSecao | null>("COVER");
  const [savedAt, setSavedAt] = useState<string | null>(() => {
    const u = (initialSettings as { updatedAt?: Date | string } | null)?.updatedAt;
    return u ? new Date(u).toISOString() : null;
  });
  const [isPending, startTransition] = useTransition();
  // Qual ação própria está rodando, para o botão certo mostrar o carregamento (isPending vale para todas)
  const [busyAction, setBusyAction] = useState<"publish" | "story" | "tip" | null>(null);
  const [uploading, setUploading] = useState<"heroImageUrl" | "couplePhotoUrl" | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ kind: "story" | "tip"; id: string; title: string } | null>(null);
  const [dirty, setDirty] = useState(false);

  const [story, setStory] = useState({ title: "", dateLabel: "", description: "" });
  const [tip, setTip] = useState({ category: "HOTEL", title: "", description: "", address: "", phone: "", linkUrl: "", discountCode: "" });

  const heroInput = useRef<HTMLInputElement>(null);
  const coupleInput = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<ConfiguracoesDoSiteDoCasamento>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  };

  const palette = interpretarPaleta(settings.dressCodePalette);
  const accent = destaqueLegivel(settings.themeColor || "#5E2B4E");

  const handleSave = () => {
    const payload = Object.fromEntries(
      CHAVES_EDITAVEIS.filter((k) => settings[k] !== undefined).map((k) => [k, settings[k]])
    ) as EntradaDaPersonalizacaoDoSite;

    const toastId = toast.loading("Publicando as alterações...");
    setBusyAction("publish");
    startTransition(async () => {
      const res = await atualizarPersonalizacaoDoSite(payload);
      setBusyAction(null);
      if (res.success) {
        setDirty(false);
        setSavedAt(new Date().toISOString());
        toast.success(`Alterações publicadas. O endereço para compartilhar é ${siteAddress}.`, { id: toastId });
      } else {
        toast.error(res.error || "Não deu para publicar as alterações. Tente de novo.", { id: toastId });
      }
    });
  };

  const handleUpload = (field: "heroImageUrl" | "couplePhotoUrl", file: File | undefined) => {
    if (!file) return;
    setUploading(field);
    const data = new FormData();
    data.append("image", file);
    startTransition(async () => {
      const res = await enviarImagemDoSite(data);
      setUploading(null);
      if (res.success && res.url) {
        update({ [field]: res.url });
        toast.success("Foto enviada. Para ela aparecer no site, toquem em “Publicar alterações”.");
      } else {
        toast.error(res.error || "Não deu para enviar a foto. Tente de novo.");
      }
    });
  };

  const handleAddStory = () => {
    if (!story.title.trim() || !story.description.trim()) {
      toast.error("Informem o título e o que aconteceu neste momento.");
      return;
    }
    setBusyAction("story");
    startTransition(async () => {
      const res = await criarItemDaHistoria({ ...story, position: storyItems.length });
      setBusyAction(null);
      if (res.success && res.item) {
        setStoryItems((prev) => [...prev, res.item as ItemDaHistoria]);
        setStory({ title: "", dateLabel: "", description: "" });
        toast.success("Momento adicionado.");
      } else {
        toast.error(res.error || "Não deu para adicionar o momento. Tente de novo.");
      }
    });
  };

  const handleAddTip = () => {
    if (!tip.title.trim()) {
      toast.error("Informem o nome do lugar.");
      return;
    }
    setBusyAction("tip");
    startTransition(async () => {
      const res = await criarDicaDoCasamento({ ...tip, position: tips.length });
      setBusyAction(null);
      if (res.success && res.tip) {
        setTips((prev) => [...prev, res.tip as Dica]);
        setTip({ category: tip.category, title: "", description: "", address: "", phone: "", linkUrl: "", discountCode: "" });
        toast.success("Dica adicionada.");
      } else {
        toast.error(res.error || "Não deu para adicionar a dica. Tente de novo.");
      }
    });
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const { kind, id } = pendingDelete;
    startTransition(async () => {
      const res = kind === "story" ? await excluirItemDaHistoria(id) : await excluirDicaDoCasamento(id);
      if (res.success) {
        if (kind === "story") setStoryItems((prev) => prev.filter((i) => i.id !== id));
        else setTips((prev) => prev.filter((t) => t.id !== id));
        toast.success(kind === "story" ? "Momento removido." : "Dica removida.");
      } else {
        toast.error(res.error || "Não deu para remover agora. Tente de novo.");
      }
      setPendingDelete(null);
    });
  };

  const toggleBlock = (key: keyof ConfiguracoesDoSiteDoCasamento, checked: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: checked }));
    startTransition(async () => {
      const res = await atualizarPersonalizacaoDoSite({ [key]: checked } as EntradaDaPersonalizacaoDoSite);
      if (res.success) toast.success(checked ? "Seção exibida no site." : "Seção ocultada do site.");
      else {
        setSettings((prev) => ({ ...prev, [key]: !checked }));
        toast.error(res.error || "Não deu para atualizar a seção. Tente de novo.");
      }
    });
  };

  const photoField = (field: "heroImageUrl" | "couplePhotoUrl", label: string, hint: string, ref: React.RefObject<HTMLInputElement | null>) => {
    const url = settings[field];
    return (
      <CampoDoEditor id={field} group label={label} hint={hint}>
        <div className="flex items-center gap-3">
          <div className="relative grid aspect-[3/4] w-[72px] shrink-0 place-items-center overflow-hidden rounded-t-full bg-areia text-center text-[11px] text-tinta-suave">
            {uploading === field ? (
              <>
                <span className="sr-only" role="status">Enviando a foto...</span>
                <Esqueleto className="absolute inset-0 rounded-none" />
              </>
            ) : url ? (
              <ImagemDaPessoa src={url} alt={`Foto atual: ${label.toLowerCase()}`} sizes="72px" className="object-cover" />
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
          <BotaoComCarregamento className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm}`} loading={uploading === field} disabled={uploading !== null} onClick={() => ref.current?.click()}>
            <Upload className="size-4" aria-hidden="true" />
            {url ? "Trocar foto" : "Enviar foto"}
          </BotaoComCarregamento>
        </div>
        <Entrada
          id={`${field}-link`}
          label="Ou cole o link da foto"
          value={url || ""}
          onChange={(e) => update({ [field]: e.target.value })}
          placeholder="https://..."
          fieldClassName="mt-1"
        />
      </CampoDoEditor>
    );
  };

  const siteAddress = urlDoSiteDoCasamento(slug, undefined, customDomain).replace(/^https?:\/\//, "");

  const preview = (
    <div className="overflow-hidden rounded-2xl bg-linho shadow-[var(--shadow-aceito-2)]">
      <div className="flex h-9 items-center gap-1.5 border-b border-linha bg-papel px-3">
        <span className="size-2.5 rounded-full bg-linha" aria-hidden="true" />
        <span className="size-2.5 rounded-full bg-linha" aria-hidden="true" />
        <span className="size-2.5 rounded-full bg-linha" aria-hidden="true" />
        <span className="ml-3 min-w-0 flex-1 truncate text-xs text-tinta-suave">{siteAddress}</span>
        {dirty && <span className="shrink-0 text-xs font-semibold text-aviso">Alterações não publicadas</span>}
      </div>
      {/* O site do casal é sempre claro: a prévia não segue o tema do painel */}
      <EscopoClaro className="h-[72vh] overflow-y-auto">
        <div className="pointer-events-none select-none" style={{ zoom: 0.5 }} aria-hidden="true">
          <VisaoDoSiteDoCasamento
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
      </EscopoClaro>
    </div>
  );

  const toggle = (id: IdDaSecao) => setOpenSection((cur) => (cur === id ? null : id));
  const isVisible = (key?: keyof ConfiguracoesDoSiteDoCasamento) => (key ? settings[key] !== false : undefined);

  /** Interruptor de "aparece no site" (publicado na hora, como antes). */
  const visibilityToggle = (key: keyof ConfiguracoesDoSiteDoCasamento, desc?: string) => (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-linho px-3 py-2">
      <div className="min-w-0">
        <label htmlFor={`block-${key}`} className="flex min-h-6 items-center gap-1.5 text-sm font-semibold text-tinta">
          {settings[key] !== false ? <Eye className="size-4" aria-hidden="true" /> : <EyeOff className="size-4" aria-hidden="true" />}
          Mostrar no site
        </label>
        {desc && <p className="text-sm text-tinta-suave">{desc}</p>}
      </div>
      <Interruptor id={`block-${key}`} checked={settings[key] !== false} onCheckedChange={(checked) => toggleBlock(key, checked)} />
    </div>
  );

  const savedLabel = dirty
    ? "alterações ainda não publicadas"
    : savedAt
      ? `publicado em ${formatoDoSalvo.format(new Date(savedAt)).replace(".", "")}`
      : "tudo publicado";

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
        <Link href={caminhoDoSiteDoCasamento(slug)} target="_blank" className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm}`}>
          <Eye className="size-4" aria-hidden="true" /> Ver o site
        </Link>
        <BotaoComCarregamento onClick={handleSave} loading={busyAction === "publish"} disabled={isPending || !dirty} className={`${estiloDoBotao.primary} ${estiloDoBotao.sm}`}>
          {dirty ? null : <Check className="size-4" aria-hidden="true" />}
          {dirty ? "Publicar alterações" : "Tudo publicado"}
        </BotaoComCarregamento>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(340px,420px)_minmax(0,1fr)] xl:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          <ol className="flex flex-col gap-1.5">
            {SECOES.map((section) => (
              <LinhaDaSecao
                key={section.id}
                id={section.id}
                title={section.label}
                visible={isVisible(section.key)}
                open={openSection === section.id}
                onToggle={() => toggle(section.id)}
              >
                {section.id === "COVER" && (
                  <>
                    <Entrada id="title" label="Nomes do casal" value={settings.title || ""} onChange={(e) => update({ title: e.target.value })} placeholder="Ana & Pedro" inputClassName="text-base font-semibold" />
                    <SeletorDeData
                      id="weddingDate"
                      label="Data do casamento"
                      value={paraCampoDeData(settings.weddingDate)}
                      onChange={(e) => update({ weddingDate: e.target.value ? `${e.target.value}T12:00:00.000Z` : null })}
                    />
                    <Entrada id="subtitle" label="Frase acima dos nomes" optional hint="Ex.: “Vamos nos casar!”" value={settings.subtitle || ""} onChange={(e) => update({ subtitle: e.target.value })} />
                    <CampoDoEditor id="themeColor" label="Cor do site">
                      <div className="flex items-center gap-2">
                        <input
                          id="themeColor"
                          type="color"
                          value={settings.themeColor || "#5E2B4E"}
                          onChange={(e) => update({ themeColor: e.target.value })}
                          className="h-12 w-14 shrink-0 cursor-pointer rounded-xl border border-linha-forte bg-papel p-1"
                          aria-describedby="themeColor-hint"
                        />
                        <Entrada
                          id="themeColorCode"
                          label="Código da cor"
                          value={settings.themeColor || ""}
                          onChange={(e) => update({ themeColor: e.target.value })}
                          fieldClassName="flex-1"
                          inputClassName="font-mono uppercase"
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
                    </CampoDoEditor>
                    {photoField("heroImageUrl", "Foto da capa", "Aparece em um arco vertical no topo do site. Prefira uma foto em pé, com vocês no centro. JPG, PNG ou WEBP de até 5 MB.", heroInput)}
                  </>
                )}

                {section.id === "STORY" && section.key && (
                  <>
                    {visibilityToggle(section.key, section.desc)}
                    <AreaDeTexto id="welcomeMessage" label="Mensagem de boas-vindas" rows={3} value={settings.welcomeMessage || ""} onChange={(e) => update({ welcomeMessage: e.target.value })} />
                    {photoField("couplePhotoUrl", "Foto do casal", "Aparece na seção “Nossa história”.", coupleInput)}

                    <fieldset className="flex flex-col gap-5 rounded-xl border border-linha p-3 pt-4">
                      <legend className="px-1 text-sm font-semibold text-tinta">Novo momento</legend>
                      <Entrada id="story-title" label="Título" value={story.title} onChange={(e) => setStory({ ...story, title: e.target.value })} placeholder="O primeiro encontro" />
                      <Entrada id="story-date" label="Quando" value={story.dateLabel} onChange={(e) => setStory({ ...story, dateLabel: e.target.value })} placeholder="Outubro de 2021" />
                      <AreaDeTexto id="story-desc" label="O que aconteceu" rows={3} value={story.description} onChange={(e) => setStory({ ...story, description: e.target.value })} />
                      <BotaoComCarregamento onClick={handleAddStory} loading={busyAction === "story"} disabled={isPending} className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm} w-fit`}>
                        <Plus className="size-4" aria-hidden="true" /> Adicionar momento
                      </BotaoComCarregamento>
                    </fieldset>
                    <ListaDeItens
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
                    <p className="text-sm text-tinta-suave">Se vocês não informarem os links de rota, o site cria os botões a partir do endereço.</p>
                    <Entrada id="locationName" label="Nome do local" value={settings.locationName || ""} onChange={(e) => update({ locationName: e.target.value })} />
                    <Entrada id="locationAddress" label="Endereço completo" value={settings.locationAddress || ""} onChange={(e) => update({ locationAddress: e.target.value })} />
                    <div className="grid grid-cols-2 gap-3">
                      <Entrada id="ceremonyTime" label="Horário da cerimônia" type="time" value={settings.ceremonyTime || ""} onChange={(e) => update({ ceremonyTime: e.target.value })} />
                      <Entrada id="receptionTime" label="Horário da recepção" type="time" value={settings.receptionTime || ""} onChange={(e) => update({ receptionTime: e.target.value })} />
                    </div>
                    <Entrada id="locationMapUrl" label="Link do Google Maps" optional value={settings.locationMapUrl || ""} onChange={(e) => update({ locationMapUrl: e.target.value })} placeholder="https://maps.app.goo.gl/..." />
                    <Entrada id="wazeUrl" label="Link do Waze" optional value={settings.wazeUrl || ""} onChange={(e) => update({ wazeUrl: e.target.value })} placeholder="https://waze.com/ul/..." />
                    <Entrada id="uberUrl" label="Link do Uber" optional value={settings.uberUrl || ""} onChange={(e) => update({ uberUrl: e.target.value })} placeholder="https://m.uber.com/ul/..." />
                  </>
                )}

                {section.id === "DRESS" && section.key && (
                  <>
                    {visibilityToggle(section.key, section.desc)}
                    <Entrada id="dressCodeTitle" label="Tipo de traje" value={settings.dressCodeTitle || ""} onChange={(e) => update({ dressCodeTitle: e.target.value })} placeholder="Passeio completo" />
                    <AreaDeTexto id="dressCodeDesc" label="Orientações" rows={3} value={settings.dressCodeDesc || ""} onChange={(e) => update({ dressCodeDesc: e.target.value })} />
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
                          <button type="button" className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm}`} onClick={() => update({ dressCodePalette: JSON.stringify([...palette, "#C5A880"]) })}>
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
                    <fieldset className="flex flex-col gap-5 rounded-xl border border-linha p-3 pt-4">
                      <legend className="px-1 text-sm font-semibold text-tinta">Nova dica</legend>
                      <Selecao value={tip.category} onValueChange={(v) => setTip({ ...tip, category: v })}>
                        <GatilhoDaSelecao id="tip-category" label="Categoria">
                          <ValorDaSelecao />
                        </GatilhoDaSelecao>
                        <ConteudoDaSelecao>
                          {Object.entries(ROTULOS_DAS_DICAS).map(([value, label]) => (
                            <ItemDaSelecao key={value} value={value}>
                              {label}
                            </ItemDaSelecao>
                          ))}
                        </ConteudoDaSelecao>
                      </Selecao>
                      <Entrada id="tip-title" label="Nome do lugar" value={tip.title} onChange={(e) => setTip({ ...tip, title: e.target.value })} />
                      <Entrada id="tip-address" label="Endereço" value={tip.address} onChange={(e) => setTip({ ...tip, address: e.target.value })} />
                      <Entrada id="tip-phone" label="Telefone" value={tip.phone} onChange={(e) => setTip({ ...tip, phone: e.target.value })} />
                      <Entrada id="tip-link" label="Site ou link de reserva" value={tip.linkUrl} onChange={(e) => setTip({ ...tip, linkUrl: e.target.value })} placeholder="https://..." />
                      <Entrada id="tip-discount" label="Cupom de desconto" value={tip.discountCode} onChange={(e) => setTip({ ...tip, discountCode: e.target.value.toUpperCase() })} inputClassName="font-semibold uppercase" />
                      <AreaDeTexto id="tip-desc" label="Descrição" rows={2} value={tip.description} onChange={(e) => setTip({ ...tip, description: e.target.value })} />
                      <BotaoComCarregamento onClick={handleAddTip} loading={busyAction === "tip"} disabled={isPending} className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm} w-fit`}>
                        <Plus className="size-4" aria-hidden="true" /> Adicionar dica
                      </BotaoComCarregamento>
                    </fieldset>
                    <ListaDeItens
                      title={`Dicas publicadas (${tips.length})`}
                      empty="Nenhuma dica ainda. A seção só aparece no site quando houver pelo menos uma."
                      items={tips.map((t) => ({ id: t.id, eyebrow: ROTULOS_DAS_DICAS[t.category] ?? t.category, title: t.title, text: t.discountCode ? `Cupom ${t.discountCode}` : t.description }))}
                      onDelete={(item) => setPendingDelete({ kind: "tip", id: item.id, title: item.title })}
                    />
                  </>
                )}

                {section.id === "MUSIC" && section.key && (
                  <>
                    {visibilityToggle(section.key, section.desc)}
                    <Entrada id="spotifyPlaylistUrl" label="Link da playlist" value={settings.spotifyPlaylistUrl || ""} onChange={(e) => update({ spotifyPlaylistUrl: e.target.value })} placeholder="https://open.spotify.com/playlist/..." />
                  </>
                )}

                {(section.id === "RSVP" || section.id === "GIFTS" || section.id === "GUESTBOOK") && section.key && visibilityToggle(section.key, section.desc)}
              </LinhaDaSecao>
            ))}
          </ol>
          <p className="text-sm text-tinta-suave">
            Ligar ou desligar uma seção vale na hora. Os textos e as fotos só vão para o site quando vocês tocam em “Publicar alterações”.
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

      <ModalDeConfirmacao
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

function ListaDeItens({
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
              <Botao
                aria-label={`Remover ${item.title}`}
                variant="ghost"
                size="icon"
                onClick={() => onDelete(item)}
                className="size-11 shrink-0 rounded-xl text-tinta-suave hover:bg-perigo-suave hover:text-perigo"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Botao>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
