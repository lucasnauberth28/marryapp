"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Guest } from "@prisma/client";

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

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Send,
  Plus,
  Trash2,
  Save,
  Paperclip,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Bell,
  Sparkles,
  X,
  Smartphone,
  ArrowLeft,
  Copy,
  CheckCheck,
  Heart,
  Calendar,
  Wifi,
  Battery,
  ChevronRight,
  Sparkle
} from "lucide-react";
import {
  createMessageTemplate,
  updateMessageTemplate,
  deleteMessageTemplate,
  sendTemplateToGuests,
} from "@/actions/message-actions";
import { sendRsvpReminders, sendInitialInvites } from "@/actions/whatsapp-actions";

interface MensagensClientProps {
  initialTemplates: MessageTemplate[];
  initialGuests: Guest[];
}

export function MensagensClient({
  initialTemplates,
  initialGuests,
}: MensagensClientProps) {
  const [templates, setTemplates] = useState<MessageTemplate[]>(initialTemplates);
  const [activeTab, setActiveTab] = useState<"templates" | "disparador">("templates");
  
  // Controls editor mode vs grid view mode
  const [isEditingMode, setIsEditingMode] = useState(false);

  // Form states
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [type, setType] = useState("CUSTOM");
  const [buttonsList, setButtonsList] = useState<Array<{ id: string; text: string }>>([
    { id: "confirm", text: "✅ Confirmar Presença" },
    { id: "decline", text: "❌ Não poderei ir" }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trigger states
  const [chosenTemplateId, setChosenTemplateId] = useState("");
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [searchGuest, setSearchGuest] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{
    success?: boolean;
    error?: string;
  } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  // Button management
  const handleAddButton = () => {
    if (buttonsList.length >= 3) {
      toast.error("O WhatsApp suporta no máximo 3 botões por mensagem.");
      return;
    }
    setButtonsList([...buttonsList, { id: `btn_${Date.now()}`, text: "Novo Botão" }]);
  };

  const handleUpdateButton = (index: number, text: string) => {
    const updated = [...buttonsList];
    updated[index].text = text;
    setButtonsList(updated);
  };

  const handleRemoveButton = (index: number) => {
    setButtonsList(buttonsList.filter((_, i) => i !== index));
  };

  const applyRsvpPreset = () => {
    setButtonsList([
      { id: "confirm", text: "✅ Confirmar Presença" },
      { id: "decline", text: "❌ Não poderei ir" }
    ]);
    toast.success("Botões de RSVP aplicados!");
  };

  const applyGiftsPreset = () => {
    setButtonsList([
      { id: "gifts", text: "🎁 Ver Lista de Presentes" },
      { id: "confirm", text: "✅ Confirmar Presença" }
    ]);
    toast.success("Botões de Presentes aplicados!");
  };

  const insertVariable = (variable: string) => {
    setContent((prev) => `${prev} ${variable}`);
  };

  const handleOpenCreateForm = () => {
    resetForm();
    setIsEditingMode(true);
  };

  const handleEdit = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setName(template.name);
    setContent(template.content);
    setMediaUrl(template.mediaUrl || "");
    setMediaType(template.mediaType || "image");
    setType(template.type || "CUSTOM");
    if (template.buttons) {
      try {
        setButtonsList(JSON.parse(template.buttons));
      } catch (e) {
        setButtonsList([]);
      }
    } else {
      setButtonsList([]);
    }
    setIsEditingMode(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("content", content);
    formData.append("mediaUrl", mediaUrl);
    formData.append("mediaType", mediaType);
    formData.append("type", type);
    formData.append("buttons", JSON.stringify(buttonsList));

    if (selectedTemplate) {
      const res = await updateMessageTemplate(selectedTemplate.id, formData);
      if (res.success && res.data) {
        setTemplates(templates.map((t) => (t.id === selectedTemplate.id ? (res.data as MessageTemplate) : t)));
        setIsEditingMode(false);
        resetForm();
        toast.success("Template atualizado com sucesso!");
      } else {
        toast.error(res.error || "Erro ao salvar template");
      }
    } else {
      const res = await createMessageTemplate(formData);
      if (res.success && res.data) {
        setTemplates([res.data as MessageTemplate, ...templates]);
        setIsEditingMode(false);
        resetForm();
        toast.success("Novo template criado!");
      } else {
        toast.error(res.error || "Erro ao criar template");
      }
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    setConfirmAction(() => async () => {
      const res = await deleteMessageTemplate(id);
      if (res.success) {
        setTemplates(templates.filter((t) => t.id !== id));
        if (selectedTemplate?.id === id) {
          resetForm();
          setIsEditingMode(false);
        }
        toast.success("Template excluído com sucesso!");
      }
    });
    setConfirmOpen(true);
  };

  const resetForm = () => {
    setSelectedTemplate(null);
    setName("");
    setContent("");
    setMediaUrl("");
    setMediaType("image");
    setType("CUSTOM");
    setButtonsList([
      { id: "confirm", text: "✅ Confirmar Presença" },
      { id: "decline", text: "❌ Não poderei ir" }
    ]);
  };

  const toggleGuest = (id: string) => {
    setSelectedGuests((prev) =>
      prev.includes(id) ? prev.filter((gid) => gid !== id) : [...prev, id]
    );
  };

  const toggleAllGuests = () => {
    if (selectedGuests.length === filteredGuests.length) {
      setSelectedGuests([]);
    } else {
      setSelectedGuests(filteredGuests.map((g) => g.id));
    }
  };

  const handleSendMessages = async () => {
    if (!chosenTemplateId) return toast.error("Selecione um template!");
    if (selectedGuests.length === 0) return toast.error("Selecione pelo menos 1 convidado!");

    setIsSending(true);
    setSendStatus(null);

    const res = await sendTemplateToGuests(chosenTemplateId, selectedGuests);
    if (res.success) {
      setSendStatus({ success: true });
      setSelectedGuests([]);
      toast.success(res.message || "Mensagens enviadas com sucesso!");
    } else {
      setSendStatus({ error: res.error || "Erro ao realizar o disparo." });
      toast.error(res.error || "Erro no disparo");
    }
    setIsSending(false);
  };

  const [isTriggeringRsvp, setIsTriggeringRsvp] = useState(false);
  const [isTriggeringInvites, setIsTriggeringInvites] = useState(false);

  const handleSendInitialInvites = async () => {
    setIsTriggeringInvites(true);
    const res = await sendInitialInvites();
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error("Erro ao disparar convites iniciais.");
    }
    setIsTriggeringInvites(false);
  };

  const handleSendRsvpReminders = async () => {
    setIsTriggeringRsvp(true);
    const res = await sendRsvpReminders();
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error("Erro ao disparar lembretes de RSVP.");
    }
    setIsTriggeringRsvp(false);
  };

  const filteredGuests = initialGuests.filter(
    (g) =>
      g.name.toLowerCase().includes(searchGuest.toLowerCase()) ||
      (g.phone && g.phone.includes(searchGuest))
  );

  const activeTemplateObj = templates.find((t) => t.id === chosenTemplateId);

  return (
    <div className="space-y-6">
      {/* Dynamic Header with Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#8C6D45] font-serif italic tracking-tight flex items-center gap-2">
            <span>Mensagens & Templates WhatsApp</span>
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Gerencie seus modelos de convites, botões de confirmação e disparo automático para convidados.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-zinc-100 rounded-2xl p-1 border border-zinc-200">
          <button
            onClick={() => {
              setActiveTab("templates");
              setIsEditingMode(false);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "templates"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Galeria de Templates ({templates.length})
          </button>
          <button
            onClick={() => setActiveTab("disparador")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "disparador"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Disparador em Massa
          </button>
        </div>
      </div>

      {activeTab === "templates" ? (
        !isEditingMode ? (
          /* ================================================================= */
          /* MODALIDADE 1: GRANDE PAINEL / GALERIA DE CARDS DE TEMPLATES      */
          /* ================================================================= */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card Especial de Cadastro: "+ Novo Template" */}
              <div
                onClick={handleOpenCreateForm}
                className="group border-2 border-dashed border-amber-300/80 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 hover:bg-amber-100/50 hover:border-amber-500 hover:shadow-xl transition-all duration-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer min-h-[260px] relative overflow-hidden"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Plus className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h3 className="font-bold text-lg text-zinc-900 mb-1 group-hover:text-amber-900 transition-colors">
                  Novo Template
                </h3>
                <p className="text-xs text-zinc-500 max-w-[200px] leading-relaxed">
                  Crie uma nova mensagem customizada com botões interativos e imagem.
                </p>
                <span className="mt-4 text-xs font-bold text-amber-700 bg-amber-100/80 px-3 py-1 rounded-full group-hover:bg-amber-600 group-hover:text-white transition-all">
                  + Abrir Criador
                </span>
              </div>

              {/* Cards dos Templates Existentes */}
              {templates.map((t) => {
                let btnCount = 0;
                let btnList: Array<{ id: string; text: string }> = [];
                if (t.buttons) {
                  try {
                    btnList = JSON.parse(t.buttons);
                    btnCount = btnList.length;
                  } catch (e) {}
                }

                return (
                  <div
                    key={t.id}
                    className="bg-white border border-zinc-200/80 hover:border-amber-300 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group relative"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        {t.type === "INITIAL_INVITE" ? (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                            💍 Convite Inicial (Sistema)
                          </span>
                        ) : t.type === "RSVP_REMINDER" ? (
                          <span className="bg-blue-100 text-blue-900 border border-blue-300 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                            🔔 Lembrete RSVP (Sistema)
                          </span>
                        ) : (
                          <span className="bg-zinc-100 text-zinc-700 border border-zinc-200 text-xs px-2.5 py-0.5 rounded-full font-medium">
                            📝 Personalizado
                          </span>
                        )}

                        {t.mediaUrl && (
                          <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" /> Mídia
                          </span>
                        )}
                      </div>

                      {/* Template Title & Snippet */}
                      <h3 className="font-bold text-zinc-900 text-base mb-2 group-hover:text-amber-800 transition-colors">
                        {t.name}
                      </h3>
                      
                      <p className="text-sm text-zinc-600 line-clamp-3 whitespace-pre-wrap leading-relaxed mb-4 bg-zinc-50/70 p-3 rounded-xl border border-zinc-100 font-sans">
                        {t.content}
                      </p>

                      {/* Botões anexados */}
                      {btnCount > 0 && (
                        <div className="space-y-1 mb-4">
                          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                            Botões Interativos ({btnCount}):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {btnList.map((btn, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg font-medium"
                              >
                                {btn.text}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center gap-2 border-t border-zinc-100 pt-4 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(t)}
                        className="rounded-xl flex-1 text-xs font-semibold hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300"
                      >
                        Editar Template
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(t.id)}
                        className="rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 h-9 w-9 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ================================================================= */
          /* MODALIDADE 2: ESTÚDIO DE CRIAÇÃO / EDICÃO COM SIMULADOR WHATSAPP  */
          /* ================================================================= */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsEditingMode(false);
                  resetForm();
                }}
                className="text-zinc-600 hover:text-zinc-900 font-semibold text-sm flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar à Galeria de Templates
              </Button>

              <span className="text-xs text-zinc-500 font-mono">
                {selectedTemplate ? `Editando ID: ${selectedTemplate.id.slice(0, 8)}...` : "Modo: Novo Template"}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Lado Esquerdo: Formulário de Configuração (7 Cols) */}
              <Card className="lg:col-span-7 shadow-md border-zinc-200/80 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                  <h3 className="font-bold text-lg text-zinc-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                    {selectedTemplate ? `Editar: ${selectedTemplate.name}` : "Criar Novo Template"}
                  </h3>
                  {selectedTemplate && (
                    <Button variant="ghost" size="sm" onClick={resetForm} className="text-xs text-zinc-500">
                      + Limpar
                    </Button>
                  )}
                </div>

                <form onSubmit={handleSaveTemplate} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="font-semibold text-zinc-700">Nome do Template</Label>
                      <Input
                        id="name"
                        placeholder="Ex: Convite de Casamento Oficial"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="rounded-xl mt-1.5"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="type" className="font-semibold text-zinc-700">Tipo / Categoria do Sistema</Label>
                      <Select value={type} onValueChange={setType}>
                        <SelectTrigger id="type" className="rounded-xl mt-1.5">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INITIAL_INVITE">💍 Convite Inicial (Sistema)</SelectItem>
                          <SelectItem value="RSVP_REMINDER">🔔 Lembrete RSVP (Sistema)</SelectItem>
                          <SelectItem value="CUSTOM">📝 Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label htmlFor="content" className="font-semibold text-zinc-700">Texto da Mensagem</Label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-zinc-400 font-medium">Inserir tag:</span>
                        <button
                          type="button"
                          onClick={() => insertVariable("{nome}")}
                          className="text-xs font-mono bg-zinc-100 hover:bg-amber-100 hover:text-amber-900 border border-zinc-200 px-2 py-0.5 rounded-md font-semibold transition"
                        >
                          + {`{nome}`}
                        </button>
                      </div>
                    </div>
                    <Textarea
                      id="content"
                      rows={5}
                      placeholder="Olá {nome}, temos a honra de convidá-lo(a) para nosso casamento..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="rounded-xl resize-none font-sans leading-relaxed text-sm"
                      required
                    />
                  </div>

                  {/* Gerenciador de Botões Clicáveis */}
                  <div className="border border-amber-200/80 bg-amber-50/40 p-4 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span>Botões / Links Interativos (WhatsApp)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button type="button" variant="outline" size="sm" onClick={applyRsvpPreset} className="text-xs h-7 rounded-lg bg-white">
                          + Preset RSVP
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={applyGiftsPreset} className="text-xs h-7 rounded-lg bg-white">
                          + Preset Presentes
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-500">
                      Adicione até 3 botões. Eles serão formatados com links clicáveis de resposta rápida.
                    </p>

                    <div className="space-y-2">
                      {buttonsList.map((btn, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs font-mono text-zinc-400 w-5">#{idx + 1}</span>
                          <Input
                            value={btn.text}
                            onChange={(e) => handleUpdateButton(idx, e.target.value)}
                            placeholder="Texto do Botão (Ex: ✅ Confirmar)"
                            className="rounded-lg h-9 text-sm bg-white"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveButton(idx)}
                            className="text-red-500 hover:text-red-700 h-9 w-9 p-0 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {buttonsList.length < 3 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddButton}
                        className="w-full text-xs rounded-lg bg-white border-dashed text-zinc-600 hover:text-zinc-900"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Adicionar Botão ({buttonsList.length}/3)
                      </Button>
                    )}
                  </div>

                  {/* Mídia Anexada (Imagem/Documento) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="mediaType" className="font-semibold text-zinc-700">Tipo de Mídia (Opcional)</Label>
                      <Select value={mediaType} onValueChange={setMediaType}>
                        <SelectTrigger id="mediaType" className="rounded-xl mt-1.5">
                          <SelectValue placeholder="Sem mídia" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="image">Imagem (JPG, PNG)</SelectItem>
                          <SelectItem value="document">Documento (PDF)</SelectItem>
                          <SelectItem value="audio">Áudio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="mediaUrl" className="font-semibold text-zinc-700">URL da Imagem (HTTPS Público)</Label>
                      <Input
                        id="mediaUrl"
                        type="url"
                        placeholder="https://..."
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        className="rounded-xl mt-1.5"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3 border-t border-zinc-100">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl flex-1 flex items-center justify-center gap-2 h-11 font-bold shadow-md"
                    >
                      <Save className="w-4 h-4" />
                      {selectedTemplate ? "Salvar Alterações" : "Salvar Template"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditingMode(false);
                        resetForm();
                      }}
                      className="rounded-xl text-zinc-600 h-11 px-6"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Lado Direito: SIMULADOR DE APP DE MENSAGENS EM TEMPO REAL (5 Cols) */}
              <div className="lg:col-span-5 sticky top-24">
                <div className="text-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                    📱 Simulador WhatsApp em Tempo Real
                  </span>
                </div>

                {/* Smartphone Container */}
                <div className="bg-zinc-900 border-[6px] border-zinc-800 rounded-[42px] p-3 shadow-2xl overflow-hidden max-w-[340px] mx-auto text-zinc-100 relative">
                  {/* Smartphone Top Notch & Status Bar */}
                  <div className="flex justify-between items-center px-4 pt-1 pb-2 text-[10px] text-zinc-400 font-mono border-b border-zinc-800/60">
                    <span>10:28</span>
                    <div className="w-16 h-3 bg-zinc-800 rounded-full mx-auto" />
                    <div className="flex items-center gap-1.5">
                      <Wifi className="w-3 h-3" />
                      <Battery className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Chat Header Bar */}
                  <div className="bg-[#1f2c34] px-3 py-2.5 flex items-center gap-3 border-b border-zinc-800">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                      <Heart className="w-4 h-4 fill-white" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-100 leading-tight">Casamento Lucas & Giovanna</h4>
                      <p className="text-[10px] text-emerald-400">online no WhatsApp</p>
                    </div>
                  </div>

                  {/* Chat Wall Canvas (WhatsApp Pattern Dark Wallpaper) */}
                  <div className="bg-[#0b141a] p-3 min-h-[380px] max-h-[460px] overflow-y-auto space-y-3 font-sans relative">
                    {/* Fake Conversation Received Bubble */}
                    <div className="flex justify-start">
                      <div className="bg-[#202c33] text-zinc-200 p-2.5 rounded-xl rounded-tl-none max-w-[85%] text-xs shadow-sm space-y-1">
                        <p className="leading-relaxed text-[11px]">
                          Olá! Vocês já lançaram os convites oficiais e a lista de presentes do casamento? 🎉
                        </p>
                        <span className="text-[9px] text-zinc-400 block text-right">10:27</span>
                      </div>
                    </div>

                    {/* LIVE SIMULATION BUBBLE OF CURRENT TEMPLATE */}
                    <div className="flex justify-end">
                      <div className="bg-[#005c4b] text-zinc-100 p-3 rounded-2xl rounded-tr-none max-w-[90%] text-xs shadow-md space-y-2 border border-emerald-600/30">
                        {/* Media Image Preview */}
                        {mediaUrl && (
                          <div className="rounded-lg overflow-hidden bg-black/40 border border-emerald-700/40 p-1">
                            {mediaType === "image" ? (
                              <img src={mediaUrl} alt="Visualização da Mídia" className="max-h-36 object-cover rounded-md w-full" />
                            ) : (
                              <div className="flex items-center gap-2 p-2 text-xs text-emerald-200">
                                <Paperclip className="w-4 h-4" />
                                <span>Arquivo: {mediaType}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Text Message Live Content */}
                        <p className="text-xs text-zinc-100 whitespace-pre-wrap leading-relaxed">
                          {(content || "Sua mensagem aparecerá aqui em tempo real...").replace(/\{nome\}/gi, "Giovanni Nespoli")}
                        </p>

                        {/* Interactive Buttons Live Simulation */}
                        {buttonsList.length > 0 && (
                          <div className="border-t border-emerald-600/50 pt-2 space-y-1.5">
                            {buttonsList.map((btn, idx) => (
                              <div
                                key={idx}
                                className="w-full bg-[#111b21] hover:bg-[#1f2c34] text-emerald-400 font-bold text-[11px] py-1.5 px-2.5 rounded-lg text-center border border-emerald-700/40 shadow-sm flex items-center justify-center gap-1"
                              >
                                <span>{btn.text || `Botão #${idx + 1}`}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-200/80 pt-0.5">
                          <span>10:28</span>
                          <CheckCheck className="w-3 h-3 text-cyan-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Smartphone Footer Fake Input Bar */}
                  <div className="bg-[#1f2c34] p-2 flex items-center gap-2 border-t border-zinc-800 text-xs text-zinc-500">
                    <div className="bg-[#2a3942] px-3 py-1.5 rounded-full flex-1 text-[11px] text-zinc-400">
                      Digite uma mensagem...
                    </div>
                    <div className="w-7 h-7 rounded-full bg-[#00a884] text-white flex items-center justify-center">
                      <Send className="w-3.5 h-3.5 fill-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        /* ================================================================= */
        /* ABA 2: DISPARADOR EM MASSA & AUTOMAÇÕES DA COMUNICAÇÃO           */
        /* ================================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Card de Disparos de Notificação Automática */}
            <Card className="shadow-md border-emerald-100 bg-gradient-to-r from-emerald-50/50 to-white rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-emerald-600" />
                  Notificações & Lembretes Automáticos (WhatsApp)
                </h3>
              </div>
              <p className="text-xs text-zinc-500 mb-4">
                Envie convites e lembretes em lote utilizando seus templates customizados com fotos e links.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={handleSendInitialInvites}
                  disabled={isTriggeringInvites}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl h-10 shadow-sm justify-start px-3"
                >
                  {isTriggeringInvites ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Disparar Convites Iniciais
                </Button>

                <Button
                  onClick={handleSendRsvpReminders}
                  disabled={isTriggeringRsvp}
                  variant="outline"
                  className="border-emerald-200 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold rounded-xl h-10 shadow-sm justify-start px-3"
                >
                  {isTriggeringRsvp ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Bell className="w-4 h-4 mr-2 text-emerald-600" />
                  )}
                  Lembretes de RSVP Pendentes
                </Button>
              </div>
            </Card>

            {/* Escolha do Template e Preview */}
            <Card className="shadow-md border-zinc-200/60 rounded-2xl p-6">
              <h3 className="font-bold text-lg text-zinc-800 mb-4">
                Passo 1: Selecione o Template
              </h3>

              <Select
                value={chosenTemplateId}
                onValueChange={setChosenTemplateId}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Escolha um evento ou mensagem" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {activeTemplateObj && (
                <div className="mt-4 p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Pré-visualização
                  </p>
                  <p className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed">
                    {activeTemplateObj.content.replace(
                      /\{nome\}/gi,
                      "Convidado",
                    )}
                  </p>
                  {activeTemplateObj.mediaUrl && (
                    <div className="mt-3 flex items-center gap-2 text-xs font-medium text-indigo-600 bg-indigo-50/50 p-2 border border-indigo-100 rounded-xl">
                      <Paperclip className="w-4 h-4" />
                      Mídia anexada: {activeTemplateObj.mediaType}
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Seleção de Convidados */}
            <Card className="shadow-md border-zinc-200/60 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h3 className="font-bold text-lg text-zinc-800">
                  Passo 2: Selecione quem irá receber
                </h3>
                <Input
                  placeholder="Buscar convidado..."
                  value={searchGuest}
                  onChange={(e) => setSearchGuest(e.target.value)}
                  className="rounded-xl max-w-xs"
                />
              </div>

              <div className="flex items-center gap-2 mb-3 text-sm">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAllGuests}
                  className="rounded-xl"
                >
                  {selectedGuests.length === filteredGuests.length
                    ? "Desmarcar Todos"
                    : "Marcar Todos"}
                </Button>
                <span className="text-zinc-500 font-medium">
                  {selectedGuests.length} selecionados de{" "}
                  {filteredGuests.length} filtrados.
                </span>
              </div>

              <div className="max-h-96 overflow-y-auto border border-zinc-100 rounded-2xl divide-y divide-zinc-100">
                {filteredGuests.map((g) => {
                  const isChecked = selectedGuests.includes(g.id);
                  return (
                    <div
                      key={g.id}
                      onClick={() => toggleGuest(g.id)}
                      className={`flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-50 transition-all ${
                        isChecked ? "bg-zinc-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="rounded text-zinc-900 focus:ring-zinc-900 h-4 w-4 border-zinc-300"
                        />
                        <div>
                          <p className="text-sm font-bold text-zinc-900">
                            {g.name}
                          </p>
                          <p className="text-xs text-zinc-400">
                            {g.phone || "Sem telefone"}
                          </p>
                        </div>
                      </div>

                      {g.hasReceivedMessage && (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Enviado
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Resumo e Disparo */}
          <Card className="lg:col-span-1 shadow-md border-zinc-200/60 rounded-2xl p-6 h-fit sticky top-24">
            <h3 className="font-bold text-lg text-zinc-800 mb-4">
              Passo 3: Enviar
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Template:</span>
                <span className="font-bold text-zinc-900 truncate max-w-[150px]">
                  {activeTemplateObj ? activeTemplateObj.name : "Nenhum"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Destinatários:</span>
                <span className="font-extrabold text-zinc-900 text-lg">
                  {selectedGuests.length}
                </span>
              </div>

              {sendStatus?.success && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2 animate-in slide-in-from-top-1">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Mensagens enviadas com sucesso!
                </div>
              )}

              {sendStatus?.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  {sendStatus.error}
                </div>
              )}

              <Button
                onClick={handleSendMessages}
                disabled={
                  isSending || !chosenTemplateId || selectedGuests.length === 0
                }
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl py-6 text-base font-bold shadow-lg shadow-zinc-900/10 flex items-center justify-center gap-2 mt-2"
              >
                <Send className="w-5 h-5" />
                {isSending ? "Disparando..." : "Disparar via WhatsApp"}
              </Button>
            </div>
          </Card>
        </div>
      )}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          confirmAction?.();
        }}
        title="Excluir Template"
        description="Tem certeza de que deseja excluir esse template?"
      />
    </div>
  );
}
