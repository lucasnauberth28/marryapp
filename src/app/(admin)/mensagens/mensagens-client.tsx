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
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Bell,
  Sparkles,
  X,
  Smartphone,
  ArrowLeft,
  CheckCheck,
  Heart,
  Wifi,
  Battery,
  Link as LinkIcon,
  Filter,
  Check,
  Gift,
  Calendar,
  Users
} from "lucide-react";
import {
  createMessageTemplate,
  updateMessageTemplate,
  deleteMessageTemplate,
  sendTemplateToGuests,
  markGuestAsSent,
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

  // iPhone 15 Plus chassis color option
  const [iphoneColor, setIphoneColor] = useState<"blue" | "natural" | "pink" | "black">("blue");

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
  const [guestFilter, setGuestFilter] = useState<"all" | "pending" | "not_sent">("all");
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{
    success?: boolean;
    error?: string;
    message?: string;
  } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  // Badge / Link Management
  const handleAddButton = () => {
    if (buttonsList.length >= 3) {
      toast.error("Você pode cadastrar no máximo 3 Badges de Links por mensagem.");
      return;
    }
    setButtonsList([...buttonsList, { id: `badge_${Date.now()}`, text: "Novo Link" }]);
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
    toast.success("Badges de Links de RSVP aplicadas!");
  };

  const applyGiftsPreset = () => {
    setButtonsList([
      { id: "gifts", text: "🎁 Ver Lista de Presentes" },
      { id: "confirm", text: "✅ Confirmar Presença" }
    ]);
    toast.success("Badges de Links de Presentes aplicadas!");
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

    const toastId = toast.loading(selectedTemplate ? "Atualizando template de mensagem..." : "Criando novo template...");

    if (selectedTemplate) {
      const res = await updateMessageTemplate(selectedTemplate.id, formData);
      if (res.success && res.data) {
        setTemplates(templates.map((t) => (t.id === selectedTemplate.id ? (res.data as MessageTemplate) : t)));
        setIsEditingMode(false);
        resetForm();
        toast.success("Template atualizado com sucesso!", { id: toastId });
      } else {
        toast.error(res.error || "Erro ao salvar template", { id: toastId });
      }
    } else {
      const res = await createMessageTemplate(formData);
      if (res.success && res.data) {
        setTemplates([res.data as MessageTemplate, ...templates]);
        setIsEditingMode(false);
        resetForm();
        toast.success("Novo template criado com sucesso!", { id: toastId });
      } else {
        toast.error(res.error || "Erro ao criar template", { id: toastId });
      }
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    setConfirmAction(() => async () => {
      const toastId = toast.loading("Excluindo template...");
      const res = await deleteMessageTemplate(id);
      if (res.success) {
        setTemplates(templates.filter((t) => t.id !== id));
        if (selectedTemplate?.id === id) {
          resetForm();
          setIsEditingMode(false);
        }
        toast.success("Template excluído com sucesso!", { id: toastId });
      } else {
        toast.error(res.error || "Erro ao excluir template", { id: toastId });
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
    const toastId = toast.loading(`Disparando mensagens para ${selectedGuests.length} convidados...`);

    const res = await sendTemplateToGuests(chosenTemplateId, selectedGuests);
    if (res.success) {
      setSendStatus({ success: true, message: res.message });
      setSelectedGuests([]);
      toast.success(res.message || "Mensagens enviadas com sucesso! 🚀", { id: toastId });
    } else {
      setSendStatus({ error: res.error || "Erro ao realizar o disparo." });
      toast.error(res.error || "Erro no disparo", { id: toastId });
    }
    setIsSending(false);
  };

  const [isTriggeringRsvp, setIsTriggeringRsvp] = useState(false);
  const [isTriggeringInvites, setIsTriggeringInvites] = useState(false);

  const handleSendInitialInvites = async () => {
    setIsTriggeringInvites(true);
    const toastId = toast.loading("Disparando convites iniciais com QR Code...");
    const res = await sendInitialInvites();
    if (res.success) {
      toast.success(res.message, { id: toastId });
    } else {
      toast.error("Erro ao disparar convites iniciais.", { id: toastId });
    }
    setIsTriggeringInvites(false);
  };

  const handleSendRsvpReminders = async () => {
    setIsTriggeringRsvp(true);
    const toastId = toast.loading("Disparando lembretes de RSVP pendentes...");
    const res = await sendRsvpReminders();
    if (res.success) {
      toast.success(res.message, { id: toastId });
    } else {
      toast.error("Erro ao disparar lembretes de RSVP.", { id: toastId });
    }
    setIsTriggeringRsvp(false);
  };

  // Filtered Guests Logic for Disparador Tab
  const filteredGuests = initialGuests.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchGuest.toLowerCase()) ||
      (g.phone && g.phone.includes(searchGuest));

    if (!matchesSearch) return false;

    if (guestFilter === "pending") return g.rsvpStatus === "PENDING";
    if (guestFilter === "not_sent") return !g.hasReceivedMessage;
    return true;
  });

  const activeTemplateObj = templates.find((t) => t.id === chosenTemplateId);

  return (
    <div className="space-y-6">
      {/* Header com Navegação por Abas */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#8C6D45] font-serif italic tracking-tight flex items-center gap-2">
            <span>Mensagens & Disparador WhatsApp</span>
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Crie modelos de mensagens com badges de links clicáveis e envie convites diretamente para os convidados.
          </p>
        </div>

        {/* Seleção de Abas Principais */}
        <div className="flex bg-zinc-100 rounded-2xl p-1 border border-zinc-200 shadow-inner">
          <button
            onClick={() => {
              setActiveTab("templates");
              setIsEditingMode(false);
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "templates"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Galeria de Templates ({templates.length})
          </button>
          <button
            onClick={() => setActiveTab("disparador")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
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
          /* MODALIDADE 1: PAINEL DE CARDS DE TEMPLATES                       */
          /* ================================================================= */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card Especial: "+ Novo Template" */}
              <div
                onClick={handleOpenCreateForm}
                className="group border-2 border-dashed border-amber-300/80 bg-gradient-to-br from-amber-50/60 via-white to-amber-50/40 hover:bg-amber-100/60 hover:border-amber-500 hover:shadow-xl transition-all duration-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer min-h-[260px] relative overflow-hidden"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Plus className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h3 className="font-bold text-lg text-zinc-900 mb-1 group-hover:text-amber-900 transition-colors">
                  Novo Template
                </h3>
                <p className="text-xs text-zinc-500 max-w-[220px] leading-relaxed">
                  Crie um modelo customizado com imagem e badges de links diretos.
                </p>
                <span className="mt-4 text-xs font-bold text-amber-800 bg-amber-100 px-3.5 py-1.5 rounded-full border border-amber-200 group-hover:bg-amber-600 group-hover:text-white transition-all">
                  + Abrir Criador
                </span>
              </div>

              {/* Cards dos Templates Cadastrados */}
              {templates.map((t) => {
                let badgeCount = 0;
                let badgeList: Array<{ id: string; text: string }> = [];
                if (t.buttons) {
                  try {
                    badgeList = JSON.parse(t.buttons);
                    badgeCount = badgeList.length;
                  } catch (e) {}
                }

                return (
                  <div
                    key={t.id}
                    className="bg-white border border-zinc-200/80 hover:border-amber-400 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group relative"
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

                      {/* Title & Content Snippet */}
                      <h3 className="font-bold text-zinc-900 text-base mb-2 group-hover:text-amber-800 transition-colors">
                        {t.name}
                      </h3>
                      
                      <p className="text-sm text-zinc-600 line-clamp-3 whitespace-pre-wrap leading-relaxed mb-4 bg-zinc-50/70 p-3 rounded-xl border border-zinc-100 font-sans">
                        {t.content}
                      </p>

                      {/* Badges de Links */}
                      {badgeCount > 0 && (
                        <div className="space-y-1 mb-4">
                          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                            Badges de Links ({badgeCount}):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {badgeList.map((b, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1"
                              >
                                <LinkIcon className="w-3 h-3 text-emerald-600" />
                                {b.text}
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
          /* MODALIDADE 2: ESTÚDIO DE EDICÃO COM IPHONE 15 PLUS SIMULATOR      */
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

                  {/* Gerenciador de Badges de Links Diretos */}
                  <div className="border border-amber-200/80 bg-amber-50/40 p-4 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                        <LinkIcon className="w-4 h-4 text-amber-600" />
                        <span>Badges de Links Clicáveis no WhatsApp</span>
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
                      As Badges geram links diretos e clicáveis formatados com emojis ao final da mensagem.
                    </p>

                    <div className="space-y-2">
                      {buttonsList.map((btn, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs font-mono text-zinc-400 w-5">#{idx + 1}</span>
                          <Input
                            value={btn.text}
                            onChange={(e) => handleUpdateButton(idx, e.target.value)}
                            placeholder="Nome da Badge (Ex: ✅ Confirmar Presença)"
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
                        Adicionar Badge ({buttonsList.length}/3)
                      </Button>
                    )}
                  </div>

                  {/* Mídia Anexada */}
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

              {/* Lado Direito: SIMULADOR IPHONE 15 PLUS EM TEMPO REAL */}
              <div className="lg:col-span-5 sticky top-24">
                {/* Seletor de Cores do iPhone 15 Plus */}
                <div className="text-center mb-3">
                  <div className="inline-flex items-center gap-1 bg-white p-1 rounded-2xl border border-zinc-200 shadow-sm text-xs font-medium">
                    <span className="text-[11px] text-zinc-500 font-semibold px-2 flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-zinc-700" /> iPhone 15 Plus:
                    </span>
                    <button
                      type="button"
                      onClick={() => setIphoneColor("blue")}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                        iphoneColor === "blue" ? "bg-blue-900 text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900"
                      }`}
                    >
                      Azul Titânio
                    </button>
                    <button
                      type="button"
                      onClick={() => setIphoneColor("natural")}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                        iphoneColor === "natural" ? "bg-stone-600 text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900"
                      }`}
                    >
                      Natural
                    </button>
                    <button
                      type="button"
                      onClick={() => setIphoneColor("pink")}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                        iphoneColor === "pink" ? "bg-pink-800 text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900"
                      }`}
                    >
                      Rosa
                    </button>
                    <button
                      type="button"
                      onClick={() => setIphoneColor("black")}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                        iphoneColor === "black" ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900"
                      }`}
                    >
                      Preto
                    </button>
                  </div>
                </div>

                {/* iPhone 15 Plus Chassis Mockup */}
                <div className="relative max-w-[340px] mx-auto py-2">
                  <div className="absolute left-[-4px] top-24 w-[4px] h-6 bg-zinc-700 rounded-l-md shadow-sm" />
                  <div className="absolute left-[-4px] top-34 w-[4px] h-11 bg-zinc-700 rounded-l-md shadow-sm" />
                  <div className="absolute left-[-4px] top-48 w-[4px] h-11 bg-zinc-700 rounded-l-md shadow-sm" />
                  <div className="absolute right-[-4px] top-36 w-[4px] h-16 bg-zinc-700 rounded-r-md shadow-sm" />

                  <div
                    className={`border-[9px] rounded-[52px] p-2 shadow-2xl overflow-hidden transition-all duration-500 relative text-zinc-100 ${
                      iphoneColor === "blue"
                        ? "bg-[#16222f] border-[#2c3d50] shadow-blue-950/60 ring-2 ring-[#3b516b]/50"
                        : iphoneColor === "natural"
                        ? "bg-[#292724] border-[#4a4742] shadow-amber-950/40 ring-2 ring-[#615e58]/50"
                        : iphoneColor === "pink"
                        ? "bg-[#331d24] border-[#593440] shadow-pink-950/60 ring-2 ring-[#704251]/50"
                        : "bg-[#111214] border-[#25272a] shadow-black/90 ring-2 ring-[#34373b]/50"
                    }`}
                  >
                    {/* iPhone Dynamic Island */}
                    <div className="relative bg-[#1f2c34] text-zinc-100 pt-2 pb-1.5 px-4 rounded-t-[42px] border-b border-zinc-800 flex items-center justify-between">
                      <span className="text-[11px] font-bold font-sans tracking-tight">09:41</span>

                      <div className="w-24 h-4.5 bg-black rounded-full flex items-center justify-between px-2 shadow-inner border border-zinc-800/80">
                        <div className="w-2 h-2 rounded-full bg-[#0d131a] border border-zinc-800" />
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-950/70 border border-blue-900/60" />
                      </div>

                      <div className="flex items-center gap-1">
                        <Wifi className="w-3 h-3 text-zinc-200" />
                        <Battery className="w-3.5 h-3.5 text-zinc-200" />
                      </div>
                    </div>

                    {/* WhatsApp Chat Header */}
                    <div className="bg-[#1f2c34] px-3 py-2 flex items-center gap-2.5 border-b border-zinc-800/80">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                        <Heart className="w-3.5 h-3.5 fill-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-zinc-100 truncate">Casamento Lucas & Giovanna</h4>
                        <p className="text-[9px] text-emerald-400 font-medium">online no WhatsApp</p>
                      </div>
                    </div>

                    {/* Chat Canvas Wallpaper */}
                    <div className="bg-[#0b141a] p-3 min-h-[380px] max-h-[460px] overflow-y-auto space-y-3 font-sans relative">
                      <div className="flex justify-start">
                        <div className="bg-[#202c33] text-zinc-200 p-2.5 rounded-2xl rounded-tl-none max-w-[85%] text-xs shadow-sm space-y-1">
                          <p className="leading-relaxed text-[11px]">
                            Olá! Vocês já lançaram os convites oficiais e a lista de presentes do casamento? 🎉
                          </p>
                          <span className="text-[9px] text-zinc-400 block text-right">09:40</span>
                        </div>
                      </div>

                      {/* LIVE SIMULATION BUBBLE */}
                      <div className="flex justify-end">
                        <div className="bg-[#005c4b] text-zinc-100 p-3 rounded-2xl rounded-tr-none max-w-[90%] text-xs shadow-md space-y-2 border border-emerald-600/30">
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

                          <p className="text-xs text-zinc-100 whitespace-pre-wrap leading-relaxed">
                            {(content || "Sua mensagem aparecerá aqui em tempo real...").replace(/\{nome\}/gi, "Giovanni Nespoli")}
                          </p>

                          {/* Render Badges with Clickable Links Simulation */}
                          {buttonsList.length > 0 && (
                            <div className="border-t border-emerald-600/50 pt-2 space-y-1.5 text-[11px]">
                              <p className="text-[10px] text-emerald-200/90 font-bold uppercase tracking-wider">
                                👇 Acesse abaixo:
                              </p>
                              {buttonsList.map((b, idx) => (
                                <div key={idx} className="bg-[#111b21] p-1.5 rounded-lg border border-emerald-700/40 font-mono text-[10px] text-emerald-300">
                                  <span className="font-bold text-white block">{b.text}:</span>
                                  <span className="underline text-emerald-400 truncate block">
                                    {b.text.toLowerCase().includes("presente") ? "https://marryapp.vercel.app/presentes" : "https://marryapp.vercel.app/rsvp"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-200/80 pt-0.5">
                            <span>09:41</span>
                            <CheckCheck className="w-3 h-3 text-cyan-400" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#1f2c34] p-2 flex items-center gap-2 border-t border-zinc-800 text-xs text-zinc-500">
                      <div className="bg-[#2a3942] px-3 py-1.5 rounded-full flex-1 text-[11px] text-zinc-400">
                        Digite uma mensagem...
                      </div>
                      <div className="w-7 h-7 rounded-full bg-[#00a884] text-white flex items-center justify-center">
                        <Send className="w-3.5 h-3.5 fill-white" />
                      </div>
                    </div>

                    <div className="bg-[#1f2c34] pt-1 pb-1 flex justify-center rounded-b-[40px]">
                      <div className="w-28 h-1 bg-white/70 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        /* ================================================================= */
        /* ABA 2: CENTRAL DE DISPAROS EM MASSA (UI/UX REDESIGNED)           */
        /* ================================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Coluna Esquerda: Automações & Seleções de Convidados (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: Disparos de Sistema Automáticos */}
            <Card className="shadow-md border-amber-200/80 bg-gradient-to-r from-amber-50/60 via-white to-amber-50/30 rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-base text-amber-950 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-600" />
                  Notificações & Lembretes Automáticos do Sistema
                </h3>
              </div>
              <p className="text-xs text-zinc-600 mb-4">
                Envie automações em lote para todos os convidados pendentes usando os templates inteligentes do sistema.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={handleSendInitialInvites}
                  disabled={isTriggeringInvites}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl h-11 shadow-sm justify-start px-4"
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
                  className="border-blue-300 text-blue-900 hover:bg-blue-50 text-xs font-bold rounded-xl h-11 shadow-sm justify-start px-4"
                >
                  {isTriggeringRsvp ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Bell className="w-4 h-4 mr-2 text-blue-600" />
                  )}
                  Lembretes de RSVP Pendente
                </Button>
              </div>
            </Card>

            {/* Passo 1: Seleção de Template */}
            <Card className="shadow-md border-zinc-200/80 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                  Selecione o Template de Mensagem
                </h3>
                {activeTemplateObj && (
                  <span className="text-xs text-amber-800 font-semibold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    Template Selecionado
                  </span>
                )}
              </div>

              <Select
                value={chosenTemplateId}
                onValueChange={setChosenTemplateId}
              >
                <SelectTrigger className="rounded-xl h-11 font-medium">
                  <SelectValue placeholder="Escolha um modelo de mensagem..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} {t.type === "INITIAL_INVITE" ? "(💍 Convite Inicial)" : t.type === "RSVP_REMINDER" ? "(🔔 Lembrete RSVP)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {activeTemplateObj && (
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Prévia do Template: {activeTemplateObj.name}
                    </p>
                    {activeTemplateObj.mediaUrl && (
                      <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5" /> Mídia Anexada
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed font-sans">
                    {activeTemplateObj.content.replace(/\{nome\}/gi, "Nome do Convidado")}
                  </p>
                </div>
              )}
            </Card>

            {/* Passo 2: Seleção & Filtro de Convidados */}
            <Card className="shadow-md border-zinc-200/80 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                  Selecione os Destinatários ({selectedGuests.length})
                </h3>

                <Input
                  placeholder="Buscar por nome ou telefone..."
                  value={searchGuest}
                  onChange={(e) => setSearchGuest(e.target.value)}
                  className="rounded-xl max-w-xs h-9 text-xs"
                />
              </div>

              {/* Filtros em Pílula */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-400 font-semibold flex items-center gap-1 mr-1">
                    <Filter className="w-3.5 h-3.5" /> Filtrar:
                  </span>
                  <button
                    onClick={() => setGuestFilter("all")}
                    className={`px-3 py-1 rounded-xl font-semibold transition ${
                      guestFilter === "all" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    Todos ({initialGuests.length})
                  </button>
                  <button
                    onClick={() => setGuestFilter("pending")}
                    className={`px-3 py-1 rounded-xl font-semibold transition ${
                      guestFilter === "pending" ? "bg-amber-700 text-white" : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                    }`}
                  >
                    RSVP Pendente
                  </button>
                  <button
                    onClick={() => setGuestFilter("not_sent")}
                    className={`px-3 py-1 rounded-xl font-semibold transition ${
                      guestFilter === "not_sent" ? "bg-blue-700 text-white" : "bg-blue-50 text-blue-800 hover:bg-blue-100"
                    }`}
                  >
                    Não Enviado
                  </button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAllGuests}
                  className="rounded-xl text-xs font-semibold h-8"
                >
                  {selectedGuests.length === filteredGuests.length ? "Desmarcar Todos" : "Marcar Todos Filtrados"}
                </Button>
              </div>

              {/* Lista Selecionável de Convidados */}
              <div className="max-h-80 overflow-y-auto border border-zinc-100 rounded-2xl divide-y divide-zinc-100 bg-white">
                {filteredGuests.map((g) => {
                  const isChecked = selectedGuests.includes(g.id);
                  return (
                    <div
                      key={g.id}
                      onClick={() => toggleGuest(g.id)}
                      className={`flex items-center justify-between p-3 cursor-pointer hover:bg-amber-50/40 transition-all ${
                        isChecked ? "bg-amber-50/70" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="rounded text-amber-600 focus:ring-amber-600 h-4 w-4 border-zinc-300 cursor-pointer"
                        />
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{g.name}</p>
                          <p className="text-xs text-zinc-400">{g.phone || "Sem telefone cadastrado"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {g.rsvpStatus === "CONFIRMED" && (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Confirmado
                          </span>
                        )}
                        {g.hasReceivedMessage ? (
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Enviado
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400 bg-zinc-50 px-2.5 py-1 rounded-full border border-zinc-200">
                            Pendente
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Coluna Direita: Resumo & Disparo Principal (4 Cols) */}
          <Card className="lg:col-span-4 shadow-lg border-zinc-200/80 rounded-2xl p-6 h-fit sticky top-24 space-y-5">
            <h3 className="font-bold text-lg text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-3">
              <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-bold">3</span>
              Confirmar & Disparar
            </h3>

            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                <span className="text-zinc-500 font-medium">Modelo Escolhido:</span>
                <span className="font-bold text-zinc-900 truncate max-w-[140px]">
                  {activeTemplateObj ? activeTemplateObj.name : "Nenhum"}
                </span>
              </div>

              <div className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                <span className="text-zinc-500 font-medium">Destinatários Selecionados:</span>
                <span className="font-extrabold text-amber-700 text-xl">
                  {selectedGuests.length}
                </span>
              </div>

              {sendStatus?.success && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-sm flex items-start gap-2.5 animate-in slide-in-from-top-1">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-xs uppercase tracking-wider text-emerald-800">Envio Concluído!</p>
                    <p className="text-xs text-emerald-700 mt-0.5">{sendStatus.message || "Mensagens entregues com sucesso!"}</p>
                  </div>
                </div>
              )}

              {sendStatus?.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-900 text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-xs uppercase tracking-wider text-red-800">Falha no Envio</p>
                    <p className="text-xs text-red-700 mt-0.5">{sendStatus.error}</p>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSendMessages}
                disabled={
                  isSending || !chosenTemplateId || selectedGuests.length === 0
                }
                className="w-full bg-gradient-to-r from-amber-600 via-amber-700 to-zinc-900 hover:from-amber-700 hover:to-zinc-800 text-white rounded-xl py-6 text-base font-bold shadow-xl shadow-amber-900/10 flex items-center justify-center gap-2 mt-2 transition-all"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Disparando mensagens...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Disparar via WhatsApp</span>
                  </>
                )}
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
