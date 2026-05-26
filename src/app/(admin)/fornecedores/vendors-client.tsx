"use client";

import { useState } from "react";
import { VendorLocal as Vendor } from "@/types/local";
import { createVendor, deleteVendor } from "@/actions/vendor-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Loader2, Link as LinkIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function VendorsClient({ initialVendors }: { initialVendors: any[] }) {
  const [vendors, setVendors] = useState<any[]>(initialVendors);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createVendor(formData);
    
    if (res.success) {
      setOpen(false);
      window.location.reload(); // Simple reload to get updated server data
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    const res = await deleteVendor(id);
    if (res.success) {
      setVendors(vendors.filter(v => v.id !== id));
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input placeholder="Buscar fornecedor..." className="max-w-xs" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Novo Fornecedor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Fornecedor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <Input name="name" placeholder="Nome da Empresa / Profissional" required />
              <Input name="category" placeholder="Categoria (ex: Buffet, Foto)" required />
              <Input name="contact" placeholder="Contato (Telefone/Email)" />
              <Input name="contractUrl" placeholder="Link do Contrato (opcional)" type="url" />
              <Input name="notes" placeholder="Observações" />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg border border-zinc-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Contrato</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                  Nenhum fornecedor cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>
                    <span className="bg-zinc-100 text-zinc-700 px-2 py-1 rounded-md text-xs font-medium">
                      {vendor.category}
                    </span>
                  </TableCell>
                  <TableCell>{vendor.contact || "-"}</TableCell>
                  <TableCell>
                    {vendor.contractUrl ? (
                      <a href={vendor.contractUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline inline-flex items-center">
                        <LinkIcon className="w-3 h-3 mr-1" /> Ver
                      </a>
                    ) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(vendor.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
