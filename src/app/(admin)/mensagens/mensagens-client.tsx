"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Guest } from "@prisma/client";

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import {
  createMessageTemplate,
  updateMessageTemplate,
  deleteMessageTemplate,
  sendTemplateToGuests,
} from "@/actions/message-actions";

interface MensagensClientProps {
  initialTemplates: MessageTemplate[];
  initialGuests: Guest[];
}

export function MensagensClient({
  initialTemplates,
  initialGuests,
}: MensagensClientProps) {
  const [templates, setTemplates] =
    useState<MessageTemplate[]>(initialTemplates);
  const [activeTab, setActiveTab] = useState<"templates" | "disparador">(
    "templates",
  );

  // States para Formulário de Template
  const [selectedTemplate, setSelectedTemplate] =
    useState<MessageTemplate | null>(null);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("image"); // image, document, audio
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States para o Disparador
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

  // Manipular CRUD de templates
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("content", content);
    formData.append("mediaUrl", mediaUrl);
    formData.append("mediaType", mediaType);

    if (selectedTemplate) {
      const res = await updateMessageTemplate(selectedTemplate.id, formData);
      if (res.success && res.data) {
        setTemplates(
          templates.map((t) => (t.id === selectedTemplate.id ? res.data! : t)),
        );
        setSelectedTemplate(null);
        resetForm();
      }
    } else {
      const res = await createMessageTemplate(formData);
      if (res.success && res.data) {
        setTemplates([res.data, ...templates]);
        resetForm();
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
  };

  // Lógica do Disparador
  const toggleGuest = (id: string) => {
    setSelectedGuests((prev) =>
      prev.includes(id) ? prev.filter((gid) => gid !== id) : [...prev, id],
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
    if (selectedGuests.length === 0)
      return toast.error("Selecione pelo menos 1 convidado!");

    setIsSending(true);
    setSendStatus(null);

    const res = await sendTemplateToGuests(chosenTemplateId, selectedGuests);
    if (res.success) {
      setSendStatus({ success: true });
      setSelectedGuests([]);
    } else {
      setSendStatus({ error: res.error || "Erro ao realizar o disparo." });
    }
    setIsSending(false);
  };

  const filteredGuests = initialGuests.filter(
    (g) =>
      g.name.toLowerCase().includes(searchGuest.toLowerCase()) ||
      (g.phone && g.phone.includes(searchGuest)),
  );

  const activeTemplateObj = templates.find((t) => t.id === chosenTemplateId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900">
            Painel de Mensageria
          </h2>
          <p className="text-zinc-500 mt-1">
            Configure templates automáticos e envie via WhatsApp.
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
            Configurar Templates
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário de Templates */}
          <Card className="lg:col-span-1 shadow-md border-zinc-200/60 rounded-2xl p-6 h-fit">
            <h3 className="font-bold text-lg text-zinc-800 flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-pink-500" />
              {selectedTemplate ? "Editar Template" : "Novo Template"}
            </h3>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Evento / Template</Label>
                <Input
                  id="name"
                  placeholder="Ex: Save the Date"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl mt-1"
                />
              </div>

              <div>
                <Label htmlFor="content">Texto da Mensagem</Label>
                <Textarea
                  id="content"
                  rows={5}
                  placeholder="Olá {nome}, temos um recado importante..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="rounded-xl mt-1 resize-none"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  Use{" "}
                  <span className="font-mono text-zinc-700">{`{nome}`}</span>{" "}
                  para substituir pelo nome do convidado.
                </p>
              </div>

              <div>
                <Label htmlFor="mediaType">Tipo de Mídia (Opcional)</Label>
                <Select value={mediaType} onValueChange={setMediaType}>
                  <SelectTrigger id="mediaType" className="rounded-xl mt-1">
                    <SelectValue placeholder="Selecione o tipo de arquivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Imagem</SelectItem>
                    <SelectItem value="document">
                      Documento (PDF, etc)
                    </SelectItem>
                    <SelectItem value="audio">Áudio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="mediaUrl">URL da Mídia (Link público)</Label>
                <Input
                  id="mediaUrl"
                  type="url"
                  placeholder="https://..."
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="rounded-xl mt-1"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl w-full flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {selectedTemplate ? "Atualizar" : "Salvar"}
                </Button>
                {selectedTemplate && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={resetForm}
                    className="rounded-xl text-zinc-500"
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </Card>

          {/* Listagem de Templates */}
          <Card className="lg:col-span-2 shadow-md border-zinc-200/60 rounded-2xl p-6">
            <h3 className="font-bold text-lg text-zinc-800 mb-4">
              Seus Templates Criados
            </h3>

            {templates.length === 0 ? (
              <div className="text-center py-16 text-zinc-400 text-sm">
                Nenhum template salvo. Crie o primeiro!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className="border border-zinc-200 p-4 rounded-2xl hover:shadow-sm transition flex flex-col justify-between bg-zinc-50/50"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-zinc-900 text-base">
                          {t.name}
                        </span>
                        {t.mediaUrl && (
                          <span className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
                            {t.mediaType === "image" && (
                              <ImageIcon className="w-3 h-3" />
                            )}
                            {t.mediaType === "document" && (
                              <FileText className="w-3 h-3" />
                            )}
                            {t.mediaType === "audio" && (
                              <Music className="w-3 h-3" />
                            )}
                            {t.mediaType}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-600 line-clamp-4 whitespace-pre-wrap font-sans mb-4">
                        {t.content}
                      </p>
                    </div>

                    <div className="flex gap-2 border-t border-zinc-200/60 pt-3 mt-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(t)}
                        className="rounded-xl flex items-center gap-1 text-zinc-600 hover:text-zinc-900 w-full"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(t.id)}
                        className="rounded-xl flex items-center gap-1 text-red-500 hover:text-red-700 hover:bg-red-50 w-full"
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : (
        /* DISPARADOR */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
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
