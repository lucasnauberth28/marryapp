"use client";

import { useState } from "react";
import { createTimelineEvent, deleteTimelineEvent } from "@/actions/timeline-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Plus, Trash2, CalendarHeart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "sonner";

export function TimelineClient({ initialEvents }: { initialEvents: any[] }) {
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
        toast.success("Evento criado com sucesso!");
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
    setEvents(events.filter(e => e.id !== confirmId));
    await deleteTimelineEvent(confirmId);
    toast.success("Evento excluído do cronograma!");
    setConfirmId(null);
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6 border-b border-zinc-100 pb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CalendarHeart className="text-zinc-400" /> Eventos
        </h2>
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
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1 space-y-2">
                  <Label>Horário</Label>
                  <Input 
                    type="time" 
                    value={formData.time} 
                    onChange={e => setFormData({ ...formData, time: e.target.value })} 
                    required 
                  />
                </div>
                <div className="col-span-3 space-y-2">
                  <Label>Título</Label>
                  <Input 
                    placeholder="Ex: Cerimônia" 
                    value={formData.title} 
                    onChange={e => setFormData({ ...formData, title: e.target.value })} 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição (Opcional)</Label>
                <Textarea 
                  placeholder="Detalhes ou local do evento..." 
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })} 
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                {loading ? "Salvando..." : "Salvar Evento"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative pl-4 border-l-2 border-zinc-200 ml-4 space-y-8 py-4">
        <AnimatePresence>
          {events.length === 0 ? (
            <p className="text-zinc-400 text-center py-8">Nenhum evento cadastrado no cronograma.</p>
          ) : (
            events.map((event, i) => (
              <motion.div 
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative pl-6"
              >
                {/* Timeline Dot */}
                <span className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center">
                  <Clock className="w-3 h-3 text-emerald-600" />
                </span>

                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 flex justify-between items-start group hover:border-emerald-200 transition-colors">
                  <div>
                    <h3 className="font-bold text-lg text-zinc-900 flex items-center gap-2">
                      <span className="text-emerald-600 font-mono bg-emerald-50 px-2 py-0.5 rounded text-sm">
                        {event.time}
                      </span> 
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-zinc-600 mt-2 text-sm">{event.description}</p>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(event.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50"
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
