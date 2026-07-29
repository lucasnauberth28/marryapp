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
  Music,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Bell,
  Sparkles,
  ExternalLink,
  Gift,
  Check,
  X,
  Smartphone
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
    toast.success("Botões de RSVP carregados!");
  };

  const applyGiftsPreset = () => {
    setButtonsList([
      { id: "gifts", text: "🎁 Ver Lista de Presentes" },
      { id: "confirm", text: "✅ Confirmar Presença" }
    ]);
    toast.success("Botões de Lista de Presentes carregados!");
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
        setSelectedTemplate(null);
        resetForm();
        toast.success("Template atualizado com sucesso!");
      } else {
        toast.error(res.error || "Erro ao salvar template");
      }
    } else {
      const res = await createMessageTemplate(formData);
      if (res.success && res.data) {
        setTemplates([res.data as MessageTemplate, ...templates]);
        resetForm();
        toast.success("Novo template criado!");
      } else {
        toast.error(res.error || "Erro ao criar template");
      }
    }
    setIsSubmitting(false);
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
  };

  const handleDelete = async (id: string) => {
    setConfirmAction(() => async () => {
      const res = await deleteMessageTemplate(id);
      if (res.success) {
        setTemplates(templates.filter((t) => t.id !== id));
        if (selectedTemplate?.id === id) resetForm();
        toast.success("Template excluído");
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
      toast.success("Mensagens enviadas com sucesso!");
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#8C6D45] font-serif italic tracking-tight">
            Painel de Mensageria & Templates WhatsApp
          </h1>
          <p className="text-zinc-500 mt-1">
            Configure templates automáticos com botões interativos e envie via WhatsApp.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-zinc-100 rounded-2xl p-1 border border-zinc-200">
          <button
            onClick={() => setActiveTab("templates")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "templates"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Templates com Botões
          </button>
          <button
            onClick={() => setActiveTab("disparador")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "disparador"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Disparador
          </button>
        </div>
      </div>

      {activeTab === "templates" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Formulário de Criar/Editar Template */}
          <Card className="lg:col-span-7 shadow-md border-zinc-200/60 rounded-2xl p-6 h-fit">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-zinc-800 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-600" />
                {selectedTemplate ? `Editar: ${selectedTemplate.name}` : "Novo Template com Botões"}
              </h3>
              {selectedTemplate && (
                <Button variant="ghost" size="sm" onClick={resetForm} className="text-xs text-zinc-500">
                  + Criar Novo
                </Button>
              )}
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Template</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Convite Inicial"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="type">Tipo / Categoria</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger id="type" className="rounded-xl mt-1">
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
                <Label htmlFor="content">Texto da Mensagem</Label>
                <Textarea
                  id="content"
                  rows={4}
                  placeholder="Olá {nome}, temos a honra de convidá-lo(a) para nosso casamento..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="rounded-xl mt-1 resize-none font-sans"
                  required
                />
                <p className="text-xs text-zinc-400 mt-1">
                  Substituição dinâmica: <span className="font-mono font-semibold text-amber-700">{`{nome}`}</span> será trocado pelo nome do convidado.
                </p>
              </div>

              {/* Botões Interativos (WhatsApp Business) */}
              <div className="border border-amber-200/80 bg-amber-50/40 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Botões Interativos (WhatsApp Business)</span>
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
                  Adicione até 3 botões interativos de resposta rápida para o convidado clicar diretamente no WhatsApp.
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

              {/* Mídia Opcional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mediaType">Tipo de Mídia (Opcional)</Label>
                  <Select value={mediaType} onValueChange={setMediaType}>
                    <SelectTrigger id="mediaType" className="rounded-xl mt-1">
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
                  <Label htmlFor="mediaUrl">URL Pública da Mídia (HTTPS)</Label>
                  <Input
                    id="mediaUrl"
                    type="url"
                    placeholder="https://..."
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="rounded-xl mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl w-full flex items-center justify-center gap-2 h-11 font-medium"
                >
                  <Save className="w-4 h-4" />
                  {selectedTemplate ? "Salvar Alterações" : "Criar Template"}
                </Button>
                {selectedTemplate && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="rounded-xl text-zinc-600 h-11"
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </Card>

          {/* Live WhatsApp Preview */}
          <Card className="lg:col-span-5 shadow-md border-zinc-200/60 rounded-2xl p-6 h-fit bg-emerald-950/90 text-white relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4 text-emerald-400 font-semibold text-sm">
              <Smartphone className="w-4 h-4" />
              <span>Pré-visualização Interativa (WhatsApp)</span>
            </div>

            {/* Simulação de Balão de Mensagem */}
            <div className="bg-[#0b141a] p-4 rounded-2xl border border-emerald-900/50 shadow-inner max-w-sm mx-auto space-y-3">
              {mediaUrl && (
                <div className="rounded-xl overflow-hidden bg-black/40 border border-emerald-900/30 flex items-center justify-center p-2 min-h-[120px]">
                  {mediaType === "image" ? (
                    <img src={mediaUrl} alt="Preview Mídia" className="max-h-40 object-cover rounded-lg w-full" />
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-emerald-300">
                      <Paperclip className="w-4 h-4" />
                      <span>Arquivo: {mediaType}</span>
                    </div>
                  )}
                </div>
              )}

              <p className="text-sm text-zinc-100 whitespace-pre-wrap leading-relaxed">
                {(content || "Sua mensagem pré-visualizada aparecerá aqui...").replace(/\{nome\}/gi, "Lucas")}
              </p>

              {/* Botões Interativos Renderizados no Balão */}
              {buttonsList.length > 0 && (
                <div className="border-t border-zinc-800 pt-2 space-y-1.5">
                  {buttonsList.map((btn, idx) => (
                    <div
                      key={idx}
                      className="w-full bg-[#1f2c34] hover:bg-[#2a3942] text-emerald-400 font-semibold text-xs py-2 px-3 rounded-lg text-center border border-emerald-900/40 transition"
                    >
                      {btn.text || `Botão #${idx + 1}`}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lista de Templates Cadastrados */}
            <div className="mt-8 border-t border-emerald-900/60 pt-6">
              <h4 className="font-bold text-sm text-emerald-300 mb-3 flex items-center justify-between">
                <span>Seus Templates Guardados ({templates.length})</span>
              </h4>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {templates.map((t) => {
                  let btnCount = 0;
                  if (t.buttons) {
                    try {
                      btnCount = JSON.parse(t.buttons).length;
                    } catch (e) {}
                  }

                  return (
                    <div
                      key={t.id}
                      className="bg-emerald-900/40 border border-emerald-800/60 p-3 rounded-xl flex items-center justify-between text-xs hover:bg-emerald-900/70 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{t.name}</span>
                          {t.type === "INITIAL_INVITE" && (
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-1.5 py-0.5 rounded font-mono">Convite Inicial</span>
                          )}
                          {t.type === "RSVP_REMINDER" && (
                            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] px-1.5 py-0.5 rounded font-mono">Lembrete RSVP</span>
                          )}
                        </div>
                        <p className="text-emerald-200/70 line-clamp-1 mt-0.5">{t.content}</p>
                        {btnCount > 0 && (
                          <span className="text-[10px] text-amber-300 font-medium mt-1 block">
                            ✨ {btnCount} botão(ões) interativo(s)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(t)} className="h-7 text-xs text-emerald-300 hover:text-white">
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)} className="h-7 w-7 p-0 text-red-400 hover:text-red-300">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      ) : (
        /* DISPARADOR & AUTOMAÇÕES DE NOTIFICAÇÃO */
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
                Envie notificações automáticas em lote diretamente para o WhatsApp dos convidados usando seus templates configurados com botões.
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
