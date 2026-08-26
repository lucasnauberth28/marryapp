"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Sliders,
  Sparkles,
  MapPin,
  Heart,
  Calendar,
  Clock,
  Navigation,
  Car,
  Eye,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  ExternalLink,
  Layers,
  Shirt,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateSiteCustomization,
  createStoryItem,
  deleteStoryItem,
  createWeddingTip,
  deleteWeddingTip,
} from "@/actions/site-builder-actions";
import { toast } from "sonner";

interface SiteBuilderClientProps {
  initialSettings: any;
  initialStoryItems: any[];
  initialTips: any[];
}

export function SiteBuilderClient({
  initialSettings,
  initialStoryItems,
  initialTips,
}: SiteBuilderClientProps) {
  const [settings, setSettings] = useState(initialSettings || {});
  const [storyItems, setStoryItems] = useState(initialStoryItems || []);
  const [tips, setTips] = useState(initialTips || []);
  const [activeTab, setActiveTab] = useState<"GENERAL" | "LOCATION" | "DRESS" | "STORY" | "TIPS" | "BLOCKS">("GENERAL");
  const [isPending, startTransition] = useTransition();

  // Novo item de história
  const [storyTitle, setStoryTitle] = useState("");
  const [storyDate, setStoryDate] = useState("");
  const [storyDesc, setStoryDesc] = useState("");

  // Nova dica
  const [tipCategory, setTipCategory] = useState("HOTEL");
  const [tipTitle, setTipTitle] = useState("");
  const [tipDesc, setTipDesc] = useState("");
  const [tipLink, setTipLink] = useState("");
  const [tipDiscount, setTipDiscount] = useState("");

  const handleSaveSettings = () => {
    const toastId = toast.loading("Publicando customizações visuais do site...");
    startTransition(async () => {
      const res = await updateSiteCustomization(settings);
      if (res.success) {
        toast.success("Configurações do site salvas e publicadas! ✨", { id: toastId });
      } else {
        toast.error("Erro ao salvar configurações.", { id: toastId });
      }
    });
  };

  const handleAddStory = () => {
    if (!storyTitle || !storyDesc) {
      toast.error("Preencha o título e a descrição do momento.");
      return;
    }

    startTransition(async () => {
      const res = await createStoryItem({
        title: storyTitle,
        dateLabel: storyDate,
        description: storyDesc,
      });

      if (res.success && res.item) {
        setStoryItems((prev) => [...prev, res.item]);
        setStoryTitle("");
        setStoryDate("");
        setStoryDesc("");
        toast.success("Momento adicionado à história! 📖");
      }
    });
  };

  const handleDeleteStory = (id: string) => {
    startTransition(async () => {
      await deleteStoryItem(id);
      setStoryItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Momento removido.");
    });
  };

  const handleAddTip = () => {
    if (!tipTitle) {
      toast.error("Preencha o nome do local ou hotel.");
      return;
    }

    startTransition(async () => {
      const res = await createWeddingTip({
        category: tipCategory,
        title: tipTitle,
        description: tipDesc,
        linkUrl: tipLink,
        discountCode: tipDiscount,
      });

      if (res.success && res.tip) {
        setTips((prev) => [...prev, res.tip]);
        setTipTitle("");
        setTipDesc("");
        setTipLink("");
        setTipDiscount("");
        toast.success("Dica adicionada aos convidados! 🏨");
      }
    });
  };

  const handleDeleteTip = (id: string) => {
    startTransition(async () => {
      await deleteWeddingTip(id);
      setTips((prev) => prev.filter((t) => t.id !== id));
      toast.success("Dica removida.");
    });
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8C6D45]/10 text-[#8C6D45] text-xs font-bold uppercase tracking-wider mb-2">
            <Sliders className="w-3.5 h-3.5" />
            No-Code Website Builder
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-serif italic tracking-tight">
            Construtor do Site dos Noivos
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Personalize todas as seções, textos, histórias e guias informativos do site do seu casamento.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/casamento" target="_blank">
            <Button
              variant="outline"
              className="rounded-full h-11 px-5 text-xs font-bold border-stone-300 gap-2 hover:bg-stone-50"
            >
              <Eye className="w-4 h-4 text-stone-600" />
              <span>Ver Site ao Vivo</span>
            </Button>
          </Link>

          <Button
            onClick={handleSaveSettings}
            disabled={isPending}
            className="bg-[#8C6D45] hover:bg-[#785c39] text-white rounded-full h-11 px-6 text-xs font-bold gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Alterações</span>
          </Button>
        </div>
      </div>

      {/* Tabs de Navegação do Construtor */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-200">
        {[
          { id: "GENERAL", label: "💖 Capa & Textos", icon: Heart },
          { id: "LOCATION", label: "📍 Local & GPS", icon: MapPin },
          { id: "DRESS", label: "👔 Dress Code", icon: Shirt },
          { id: "STORY", label: "📖 Nossa História", icon: BookOpen },
          { id: "TIPS", label: "🏨 Dicas & Hotéis", icon: Sparkles },
          { id: "BLOCKS", label: "⚙️ Ativar Blocos", icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-[#8C6D45] text-white shadow-xs"
                  : "bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. ABA CAPA & TEXTOS PRINCIPAIS */}
      {/* ========================================================================= */}
      {activeTab === "GENERAL" && (
        <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-6 max-w-4xl">
          <h2 className="text-lg font-bold font-serif text-stone-900">
            Títulos e Identidade do Casal
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 uppercase">Nomes do Casal</label>
              <Input
                value={settings.title || ""}
                onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                placeholder="Lucas & Giovanna"
                className="bg-stone-50/50 rounded-2xl h-12 font-serif text-base font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 uppercase">Subtítulo / Chamada</label>
              <Input
                value={settings.subtitle || ""}
                onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
                placeholder="11 de Outubro de 2027 • São Paulo"
                className="bg-stone-50/50 rounded-2xl h-12"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-600 uppercase">Mensagem de Boas-Vindas aos Convidados</label>
            <Textarea
              value={settings.welcomeMessage || ""}
              onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
              rows={3}
              placeholder="Mensagem carinhosa de abertura..."
              className="bg-stone-50/50 rounded-2xl"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              onClick={handleSaveSettings}
              disabled={isPending}
              className="bg-[#8C6D45] hover:bg-[#785c39] text-white rounded-full font-bold text-xs h-11 px-6 gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ABA LOCALIZAÇÃO & GPS */}
      {/* ========================================================================= */}
      {activeTab === "LOCATION" && (
        <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-6 max-w-4xl">
          <h2 className="text-lg font-bold font-serif text-stone-900">
            Local, Horários e Botões Waze/Uber
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 uppercase">Nome do Espaço / Igreja</label>
              <Input
                value={settings.locationName || ""}
                onChange={(e) => setSettings({ ...settings, locationName: e.target.value })}
                placeholder="Espaço Monte Castelo"
                className="bg-stone-50/50 rounded-2xl h-12"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 uppercase">Endereço Completo</label>
              <Input
                value={settings.locationAddress || ""}
                onChange={(e) => setSettings({ ...settings, locationAddress: e.target.value })}
                placeholder="Rua das Flores, 1200 - São Paulo, SP"
                className="bg-stone-50/50 rounded-2xl h-12"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 uppercase">Horário da Cerimônia</label>
              <Input
                value={settings.ceremonyTime || ""}
                onChange={(e) => setSettings({ ...settings, ceremonyTime: e.target.value })}
                placeholder="16:30"
                className="bg-stone-50/50 rounded-2xl h-12"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 uppercase">Horário da Recepção</label>
              <Input
                value={settings.receptionTime || ""}
                onChange={(e) => setSettings({ ...settings, receptionTime: e.target.value })}
                placeholder="18:30"
                className="bg-stone-50/50 rounded-2xl h-12"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 uppercase">Link do Waze</label>
              <Input
                value={settings.wazeUrl || ""}
                onChange={(e) => setSettings({ ...settings, wazeUrl: e.target.value })}
                placeholder="https://waze.com/ul/..."
                className="bg-stone-50/50 rounded-2xl h-12 font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 uppercase">Link do Uber</label>
              <Input
                value={settings.uberUrl || ""}
                onChange={(e) => setSettings({ ...settings, uberUrl: e.target.value })}
                placeholder="https://m.uber.com/ul/..."
                className="bg-stone-50/50 rounded-2xl h-12 font-mono text-xs"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              onClick={handleSaveSettings}
              disabled={isPending}
              className="bg-[#8C6D45] hover:bg-[#785c39] text-white rounded-full font-bold text-xs h-11 px-6 gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Localização</span>
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ABA DRESS CODE & PALETA DE CORES */}
      {/* ========================================================================= */}
      {activeTab === "DRESS" && (
        <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-6 max-w-4xl">
          <h2 className="text-lg font-bold font-serif text-stone-900">
            Guia de Trajes & Paleta de Cores dos Convidados
          </h2>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-600 uppercase">Tipo de Traje</label>
            <Input
              value={settings.dressCodeTitle || ""}
              onChange={(e) => setSettings({ ...settings, dressCodeTitle: e.target.value })}
              placeholder="Passeio Completo / Traje Social"
              className="bg-stone-50/50 rounded-2xl h-12 font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-600 uppercase">Orientações e Dicas</label>
            <Textarea
              value={settings.dressCodeDesc || ""}
              onChange={(e) => setSettings({ ...settings, dressCodeDesc: e.target.value })}
              rows={3}
              placeholder="Para homens: terno com gravata. Para mulheres: vestidos longos..."
              className="bg-stone-50/50 rounded-2xl"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              onClick={handleSaveSettings}
              disabled={isPending}
              className="bg-[#8C6D45] hover:bg-[#785c39] text-white rounded-full font-bold text-xs h-11 px-6 gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Dress Code</span>
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ABA NOSSA HISTÓRIA (STORYTELLING) */}
      {/* ========================================================================= */}
      {activeTab === "STORY" && (
        <div className="space-y-6 max-w-4xl">
          {/* Adicionar Novo Momento */}
          <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-4">
            <h2 className="text-lg font-bold font-serif text-stone-900">
              Adicionar Novo Capítulo da História
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-600 uppercase">Título do Momento</label>
                <Input
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  placeholder="Ex: O Primeiro Encontro"
                  className="bg-stone-50/50 rounded-2xl h-12"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-600 uppercase">Data ou Ano</label>
                <Input
                  value={storyDate}
                  onChange={(e) => setStoryDate(e.target.value)}
                  placeholder="Ex: Outubro de 2021"
                  className="bg-stone-50/50 rounded-2xl h-12"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-600 uppercase">Descrição do Momento</label>
              <Textarea
                value={storyDesc}
                onChange={(e) => setStoryDesc(e.target.value)}
                placeholder="Conte como aconteceu esse momento marcante..."
                rows={3}
                className="bg-stone-50/50 rounded-2xl"
              />
            </div>

            <Button
              onClick={handleAddStory}
              disabled={isPending}
              className="bg-[#8C6D45] hover:bg-[#785c39] text-white rounded-full font-bold text-xs h-11 px-6 gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Momento</span>
            </Button>
          </div>

          {/* Lista de Momentos Cadastrados */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider">
              Capítulos Publicados ({storyItems.length})
            </h3>

            {storyItems.map((item) => (
              <div
                key={item.id}
                className="p-5 bg-white rounded-2xl border border-stone-200 flex items-center justify-between gap-4 shadow-xs"
              >
                <div>
                  <span className="text-[10px] font-bold text-[#8C6D45] uppercase">{item.dateLabel}</span>
                  <h4 className="font-bold text-stone-900 font-serif text-base">{item.title}</h4>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2">{item.description}</p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteStory(item.id)}
                  className="text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-full h-9 w-9"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ABA DICAS & HOTÉIS */}
      {/* ========================================================================= */}
      {activeTab === "TIPS" && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-4">
            <h2 className="text-lg font-bold font-serif text-stone-900">
              Cadastrar Dica aos Convidados
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-600 uppercase">Categoria</label>
                <Select value={tipCategory} onValueChange={setTipCategory}>
                  <SelectTrigger className="w-full bg-stone-50/50 border border-stone-200 rounded-2xl h-12 px-4 text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOTEL">Hotel / Hospedagem</SelectItem>
                    <SelectItem value="SALON">Salão de Beleza / Maquiagem</SelectItem>
                    <SelectItem value="TRANSFER">Transporte / Van</SelectItem>
                    <SelectItem value="DRESS">Aluguel de Trajes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-600 uppercase">Nome do Estabelecimento</label>
                <Input
                  value={tipTitle}
                  onChange={(e) => setTipTitle(e.target.value)}
                  placeholder="Ex: Hotel Blue Tree Premium"
                  className="bg-stone-50/50 rounded-2xl h-12"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-600 uppercase">Link do Site / Reserva</label>
                <Input
                  value={tipLink}
                  onChange={(e) => setTipLink(e.target.value)}
                  placeholder="https://..."
                  className="bg-stone-50/50 rounded-2xl h-12"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-600 uppercase">Cupom de Desconto</label>
                <Input
                  value={tipDiscount}
                  onChange={(e) => setTipDiscount(e.target.value)}
                  placeholder="CASAMENTOLUCAS10"
                  className="bg-stone-50/50 rounded-2xl h-12 uppercase font-mono font-bold"
                />
              </div>
            </div>

            <Button
              onClick={handleAddTip}
              disabled={isPending}
              className="bg-[#8C6D45] hover:bg-[#785c39] text-white rounded-full font-bold text-xs h-11 px-6 gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Dica</span>
            </Button>
          </div>

          {/* Lista de Dicas */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider">
              Dicas Publicadas ({tips.length})
            </h3>

            {tips.map((tip) => (
              <div
                key={tip.id}
                className="p-5 bg-white rounded-2xl border border-stone-200 flex items-center justify-between gap-4 shadow-xs"
              >
                <div>
                  <Badge className="bg-stone-100 text-stone-700 text-[10px] font-bold">
                    {tip.category}
                  </Badge>
                  <h4 className="font-bold text-stone-900 font-serif text-base mt-1">{tip.title}</h4>
                  {tip.discountCode && (
                    <p className="text-xs text-[#8C6D45] font-mono font-bold mt-0.5">
                      Cupom: {tip.discountCode}
                    </p>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteTip(tip.id)}
                  className="text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-full h-9 w-9"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. ABA LIGA / DESLIGA DE BLOCOS MODULARES */}
      {/* ========================================================================= */}
      {activeTab === "BLOCKS" && (
        <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-6 max-w-4xl">
          <div>
            <h2 className="text-lg font-bold font-serif text-stone-900">
              Controle de Seções Modulares
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Ative ou oculte as seções públicas do site do casamento conforme a sua necessidade.
            </p>
          </div>

          <div className="divide-y divide-stone-100">
            {[
              { key: "showStory", label: "📖 Nossa História (Storytelling)", desc: "Linha do tempo dos momentos do casal" },
              { key: "showLocation", label: "📍 Localização & GPS (Waze / Uber)", desc: "Endereço, horários e botões de rota" },
              { key: "showDressCode", label: "👔 Dress Code & Paleta de Cores", desc: "Guia de estilo e traje dos convidados" },
              { key: "showTips", label: "🏨 Dicas aos Convidados", desc: "Hotéis parceiros e salões de beleza" },
              { key: "showGifts", label: "🎁 Vitrine de Presentes", desc: "Cards de presentes embutidos com checkout" },
              { key: "showGuestbook", label: "💌 Mural de Recados", desc: "Espaço para os convidados deixarem mensagens" },
            ].map((block) => (
              <div key={block.key} className="py-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-stone-900">{block.label}</h4>
                  <p className="text-xs text-stone-500">{block.desc}</p>
                </div>
                <Switch
                  checked={settings[block.key] ?? true}
                  onCheckedChange={(checked) => {
                    const updated = { ...settings, [block.key]: checked };
                    setSettings(updated);
                    updateSiteCustomization({ [block.key]: checked });
                    toast.success("Seção atualizada!");
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
