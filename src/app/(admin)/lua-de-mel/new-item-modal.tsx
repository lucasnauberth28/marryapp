"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { CustomModal } from "@/components/ui/custom-modal";
import { createHoneymoonItem } from "@/actions/honeymoon-actions";
import { Switch } from "@/components/ui/switch";

export function NewHoneymoonItemModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleAction(formData: FormData) {
    setIsPending(true);
    try {
      await createHoneymoonItem(formData);
      setIsOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-zinc-900 text-zinc-50 hover:bg-zinc-800 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Novo Gasto
      </Button>

      <CustomModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Novo Gasto"
        description="Adicione despesas para estimar o total da sua lua de mel."
      >
        <form action={handleAction} className="space-y-4">
          <div className="space-y-2 group">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider group-focus-within:text-zinc-800 transition-colors">Descrição</label>
            <Input 
              name="title" 
              placeholder="Ex: Hotel em Paris" 
              required 
              disabled={isPending}
              className="bg-white border-zinc-200 focus-visible:ring-zinc-400 transition-shadow" 
            />
          </div>
          <div className="space-y-2 group">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider group-focus-within:text-zinc-800 transition-colors">Categoria</label>
            <Input 
              name="category" 
              placeholder="Hospedagem, Voo..." 
              required 
              disabled={isPending}
              className="bg-white border-zinc-200 focus-visible:ring-zinc-400 transition-shadow" 
            />
          </div>
          <div className="space-y-2 group">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider group-focus-within:text-zinc-800 transition-colors">Valor Estimado</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">R$</span>
              <Input 
                name="amount" 
                type="number" 
                step="0.01" 
                placeholder="0,00" 
                required 
                disabled={isPending}
                className="pl-9 bg-white border-zinc-200 focus-visible:ring-zinc-400 transition-shadow" 
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 shadow-sm">
            <div className="space-y-0.5">
              <label className="text-sm font-medium text-zinc-900">Já está pago?</label>
              <p className="text-xs text-zinc-500">Marque se já efetuou o pagamento.</p>
            </div>
            <Switch name="isPaid" disabled={isPending} />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isPending}
              className="font-medium shadow-md hover:shadow-lg transition-all duration-200 bg-zinc-900 text-white hover:bg-zinc-800"
            >
              {isPending ? "Salvando..." : "Salvar Item"}
            </Button>
          </div>
        </form>
      </CustomModal>
    </>
  );
}
