"use client";

import { useState } from "react";
import { createTimelineEvent, deleteTimelineEvent } from "@/actions/timeline-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Plus, Trash2, CalendarHeart, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "sonner";
import { generateTimelinePdf } from "@/lib/generate-timeline-pdf";
import { TimePicker } from "@/components/ui/time-picker";

export function TimelineClient({ initialEvents, coupleNames }: { initialEvents: any[]; coupleNames: string }) {
  const [events, setEvents] = useState(initialEvents);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    time: "",
    description: "",
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Adicionando evento ao cronograma...");
    try {
      const payload = {
        ...formData,
        icon: "Clock",
        position: events.length,
      };
      const res = await createTimelineEvent(payload);
      if (res.success) {
        setEvents([...events, { id: Math.random().toString(), ...payload }]);
        setIsModalOpen(false);
        setFormData({ title: "", time: "", description: "" });
        toast.success("Evento criado com sucesso!", { id: toastId });
      } else {
        toast.error("Erro ao salvar evento.", { id: toastId });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmId(id);
    setConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!confirmId) return;
    const targetId = confirmId;
    setConfirmOpen(false);
    setConfirmId(null);
    const toastId = toast.loading("Removendo evento...");
    setEvents(prev => prev.filter(e => e.id !== targetId));
    await deleteTimelineEvent(targetId);
    toast.success("Evento excluído do cronograma!", { id: toastId });
  };

  const handleExportPdf = () => {
    if (events.length === 0) {
      toast.error("Nenhum evento cadastrado para gerar o PDF.");
      return;
    }
    const success = generateTimelinePdf(events, coupleNames);
    if (success) {
      toast.success("PDF do cronograma gerado com sucesso!");
    }
  };

  return (
    <div className="bg-papel border border-zinc-200 rounded-xl p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b border-zinc-100 pb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CalendarHeart className="text-zinc-500" aria-hidden="true" /> Eventos
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExportPdf}
            disabled={events.length === 0}
            className="border-zinc-300 text-zinc-700 hover:bg-zinc-100"
          >
            <Download className="w-4 h-4 mr-2 text-brand" /> Gerar PDF
          </Button>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-zinc-900 hover:bg-zinc-800 text-white">
                <Plus className="w-4 h-4 mr-2" /> Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar ao Cronograma</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input 
                    placeholder="Ex: Cerimônia, Recepção, Valsa..." 
                    value={formData.title} 
                    onChange={e => setFormData({ ...formData, title: e.target.value })} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <TimePicker 
                    value={formData.time} 
                    onChange={e => setFormData({ ...formData, time: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição (Opcional)</Label>
                  <Textarea 
                    placeholder="Detalhes ou local do evento..." 
                    value={formData.description} 
                    onChange={e => setFormData({ ...formData, description: e.target.value })} 
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-brand hover:bg-brand-600 text-white">
                  {loading ? "Salvando..." : "Salvar Evento"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative pl-4 border-l-2 border-line ml-4 space-y-8 py-4">
        <AnimatePresence>
          {events.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">Nenhum evento cadastrado no cronograma.</p>
          ) : (
            [...events]
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((event, i) => (
              <motion.div 
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative pl-6"
              >
                {/* Timeline Dot */}
                <span className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-brand-100 border-2 border-brand flex items-center justify-center">
                  <Clock className="w-3 h-3 text-brand" />
                </span>

                <div className="bg-paper border border-line rounded-lg p-4 flex justify-between items-start group hover:border-brand-300/50 transition-colors shadow-sm">
                  <div>
                    <h3 className="font-semibold text-base text-zinc-900 flex items-center gap-2">
                      <span className="text-brand font-mono bg-brand-100 px-2 py-0.5 rounded text-sm font-semibold">
                        {event.time}
                      </span> 
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-zinc-600 mt-2 text-sm">{event.description}</p>
                    )}
                  </div>
                  <Button aria-label="Excluir" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(event.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-perigo hover:bg-perigo-suave"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {confirmOpen && (
        <ConfirmModal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={executeDelete}
          title="Excluir Evento"
          description="Deseja realmente remover este evento do cronograma do casamento?"
        />
      )}
    </div>
  );
}

