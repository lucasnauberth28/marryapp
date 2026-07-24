"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { VendorLocal as Vendor } from "@/types/local";
import { createVendor, deleteVendor } from "@/actions/vendor-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Loader2, Link as LinkIcon, FileText, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function VendorsClient({ initialVendors }: { initialVendors: any[] }) {
  const [vendors, setVendors] = useState<any[]>(initialVendors);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  
  const [contractMode, setContractMode] = useState<"file" | "url">("file");
  const [fileBase64, setFileBase64] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { // max 8MB
      toast.error("O arquivo deve ter no máximo 8MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setFileBase64(event.target?.result as string);
      setFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    if (contractMode === "file" && fileBase64) {
      formData.set("contractUrl", fileBase64);
    }

    const res = await createVendor(formData);
    
    if (res.success) {
      setOpen(false);
      setFileBase64("");
      setFileName("");
      window.location.reload();
    } else {
      toast.error(res.error);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setConfirmAction(() => async () => {
      const res = await deleteVendor(id);
      if (res.success) {
        setVendors(vendors.filter(v => v.id !== id));
        toast.success("Fornecedor excluído");
      } else {
        toast.error(res.error);
      }
    });
    setConfirmOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input placeholder="Buscar fornecedor..." className="max-w-xs" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Novo Fornecedor</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Fornecedor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <Input name="name" placeholder="Nome da Empresa / Profissional" required />
              <Input name="category" placeholder="Categoria (ex: Buffet, Foto)" required />
              <Input name="contact" placeholder="Contato (Telefone/Email)" />
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-zinc-600">Contrato</label>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setContractMode("file")}
                      className={`px-2 py-0.5 rounded ${contractMode === "file" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"}`}
                    >
                      Anexar PDF / Arquivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setContractMode("url")}
                      className={`px-2 py-0.5 rounded ${contractMode === "url" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"}`}
                    >
                      Link Web (URL)
                    </button>
                  </div>
                </div>

                {contractMode === "file" ? (
                  <div className="border-2 border-dashed border-zinc-200 rounded-lg p-3 text-center relative hover:bg-zinc-50 transition">
                    <input
                      type="file"
                      accept="application/pdf,image/*,.doc,.docx"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm">
                      <Upload className="w-4 h-4 text-zinc-400" />
                      <span>{fileName ? fileName : "Clique para escolher PDF ou Imagem"}</span>
                    </div>
                  </div>
                ) : (
                  <Input name="contractUrl" placeholder="https://exemplo.com/contrato.pdf" type="url" />
                )}
              </div>

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
                      vendor.contractUrl.startsWith("data:") ? (
                        <a
                          href={vendor.contractUrl}
                          download={`contrato_${vendor.name.replace(/\s+/g, "_")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 hover:text-emerald-800 font-medium text-xs bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> Ver PDF
                        </a>
                      ) : (
                        <a
                          href={vendor.contractUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline text-xs inline-flex items-center gap-1 font-medium"
                        >
                          <LinkIcon className="w-3.5 h-3.5" /> Abrir Link
                        </a>
                      )
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
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          confirmAction?.();
        }}
        title="Excluir Fornecedor"
        description="Tem certeza de que deseja excluir este fornecedor?"
      />
    </div>
  );
}
