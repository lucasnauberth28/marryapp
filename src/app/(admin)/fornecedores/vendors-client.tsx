"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { VendorLocal as Vendor } from "@/types/local";
import { createVendor, updateVendor, deleteVendor } from "@/actions/vendor-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Plus, Trash2, Pencil, Loader2, Link as LinkIcon, FileText, Upload, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function VendorsClient({ initialVendors }: { initialVendors: any[] }) {
  const [vendors, setVendors] = useState<any[]>(initialVendors);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [formKey, setFormKey] = useState(0);

  // Estados do modal de cadastro
  const [contractMode, setContractMode] = useState<"file" | "url">("file");
  const [fileBase64, setFileBase64] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");

  // Estados do modal de edição
  const [editContractMode, setEditContractMode] = useState<"file" | "url">("file");
  const [editFileBase64, setEditFileBase64] = useState<string>("");
  const [editFileName, setEditFileName] = useState<string>("");
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    contact: "",
    contractUrl: "",
    notes: "",
  });

  const resetForm = () => {
    setContractMode("file");
    setFileBase64("");
    setFileName("");
    setFormKey(prev => prev + 1);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetEditForm = () => {
    setEditingVendor(null);
    setEditContractMode("file");
    setEditFileBase64("");
    setEditFileName("");
    setEditForm({ name: "", category: "", contact: "", contractUrl: "", notes: "" });
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { // max 8MB
      toast.error("O arquivo deve ter no máximo 8MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = event.target?.result as string;
      if (isEdit) {
        setEditFileBase64(res);
        setEditFileName(file.name);
      } else {
        setFileBase64(res);
        setFileName(file.name);
      }
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
      resetForm();
      setOpen(false);
      window.location.reload();
    } else {
      toast.error(res.error || "Erro ao criar fornecedor. Tente novamente.", {
        duration: 6000,
        description: "Ocorreu um erro inesperado no servidor.",
      });
    }
    setLoading(false);
  };

  const openEditModal = (vendor: any) => {
    setEditingVendor(vendor);
    setEditForm({
      name: vendor.name || "",
      category: vendor.category || "",
      contact: vendor.contact || "",
      contractUrl: vendor.contractUrl || "",
      notes: vendor.notes || "",
    });

    if (vendor.contractUrl && !vendor.contractUrl.startsWith("data:")) {
      setEditContractMode("url");
    } else {
      setEditContractMode("file");
      if (vendor.contractUrl?.startsWith("data:")) {
        setEditFileName("Arquivo Anexado Atual");
      }
    }

    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingVendor) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("name", editForm.name);
    formData.append("category", editForm.category);
    formData.append("contact", editForm.contact);
    formData.append("notes", editForm.notes);

    if (editContractMode === "file") {
      if (editFileBase64) {
        formData.append("contractUrl", editFileBase64);
      } else if (editingVendor.contractUrl?.startsWith("data:")) {
        formData.append("contractUrl", editingVendor.contractUrl);
      }
    } else {
      formData.append("contractUrl", editForm.contractUrl);
    }

    const res = await updateVendor(editingVendor.id, formData);

    if (res.success) {
      setVendors(vendors.map(v => v.id === editingVendor.id ? {
        ...v,
        name: editForm.name,
        category: editForm.category,
        contact: editForm.contact,
        notes: editForm.notes,
        contractUrl: editContractMode === "file" ? (editFileBase64 || editingVendor.contractUrl) : editForm.contractUrl,
      } : v));
      resetEditForm();
      setEditOpen(false);
      toast.success("Fornecedor atualizado com sucesso!");
    } else {
      toast.error(res.error || "Erro ao atualizar fornecedor.", {
        duration: 6000,
        description: "Ocorreu um erro inesperado no servidor.",
      });
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setConfirmAction(() => async () => {
      const res = await deleteVendor(id);
      if (res.success) {
        setVendors(vendors.filter(v => v.id !== id));
        toast.success("Fornecedor excluído com sucesso");
      } else {
        toast.error(res.error || "Erro ao excluir fornecedor.", {
          duration: 6000,
          description: "Ocorreu um erro inesperado no servidor.",
        });
      }
    });
    setConfirmOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Botão de Cadastro */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#8C6D45] font-serif italic tracking-tight">
            Fornecedores do Casamento
          </h1>
          <p className="text-zinc-500 text-xs mt-0.5">
            Cadastre e edite contatos, contratos e observações dos prestadores de serviço.
          </p>
        </div>

        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#8C6D45] hover:bg-[#755630] text-white">
              <Plus className="w-4 h-4 mr-2" /> Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#8C6D45]" />
                Adicionar Fornecedor
              </DialogTitle>
            </DialogHeader>
            <form key={formKey} onSubmit={handleCreate} className="space-y-4 mt-4">
              <Input name="name" placeholder="Nome da Empresa / Profissional" required />
              <Input name="category" placeholder="Categoria (ex: Buffet, Foto)" required />
              <Input name="contact" placeholder="Contato (Telefone/Email)" />
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-semibold text-zinc-600">Contrato</Label>
                  <div className="flex gap-2 text-xs">
                    <Button
                      type="button"
                      variant={contractMode === "file" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setContractMode("file")}
                      className="h-6 px-2 text-xs rounded"
                    >
                      Anexar PDF / Arquivo
                    </Button>
                    <Button
                      type="button"
                      variant={contractMode === "url" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setContractMode("url")}
                      className="h-6 px-2 text-xs rounded"
                    >
                      Link Web (URL)
                    </Button>
                  </div>
                </div>

                {contractMode === "file" ? (
                  <div className="border-2 border-dashed border-zinc-200 rounded-lg p-3 text-center relative hover:bg-zinc-50 transition">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf,image/*,.doc,.docx"
                      onChange={(e) => handleFileChange(e, false)}
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
              <Button type="submit" className="w-full bg-[#8C6D45] hover:bg-[#755630] text-white" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Fornecedor"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabela Paginada via DataTable */}
      <DataTable
        data={vendors}
        pageSize={15}
        keyExtractor={(v) => v.id}
        searchPlaceholder="Buscar por nome ou categoria..."
        emptyMessage="Nenhum fornecedor cadastrado."
        columns={[
          {
            key: "name",
            header: "Nome / Empresa",
            sortable: true,
            accessor: (v) => v.name,
            cell: (v) => (
              <div className="space-y-0.5">
                <span className="font-semibold text-zinc-900 text-sm block">{v.name}</span>
                {v.notes && <span className="text-xs text-zinc-400 line-clamp-1">{v.notes}</span>}
              </div>
            ),
          },
          {
            key: "category",
            header: "Categoria",
            sortable: true,
            accessor: (v) => v.category,
            cell: (v) => (
              <Badge variant="outline" className="bg-zinc-50 text-zinc-700 font-medium text-xs border-zinc-200">
                {v.category}
              </Badge>
            ),
          },
          {
            key: "contact",
            header: "Contato",
            sortable: true,
            accessor: (v) => v.contact || "",
            cell: (v) => (
              <span className="text-xs text-zinc-600 font-mono">
                {v.contact || "—"}
              </span>
            ),
          },
          {
            key: "contractUrl",
            header: "Contrato",
            sortable: false,
            cell: (v) => (
              v.contractUrl ? (
                v.contractUrl.startsWith("data:") ? (
                  <a
                    href={v.contractUrl}
                    download={`contrato_${v.name.replace(/\s+/g, "_")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 hover:text-emerald-800 font-medium text-xs bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-flex items-center gap-1 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" /> Ver PDF
                  </a>
                ) : (
                  <a
                    href={v.contractUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline text-xs inline-flex items-center gap-1 font-medium"
                  >
                    <LinkIcon className="w-3.5 h-3.5" /> Abrir Link
                  </a>
                )
              ) : (
                <span className="text-zinc-400 text-xs italic">Sem contrato</span>
              )
            ),
          },
          {
            key: "actions",
            header: "Ações",
            sortable: false,
            searchable: false,
            className: "text-right pr-4",
            headerClassName: "text-right pr-4",
            cell: (v) => (
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:text-zinc-900" onClick={() => openEditModal(v)} title="Editar Fornecedor">
                  <Pencil className="w-4 h-4 text-zinc-600" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(v.id)} title="Excluir Fornecedor">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ),
          },
        ]}
      />

      {/* Modal de Edição de Fornecedor & Contrato */}
      <Dialog open={editOpen} onOpenChange={(isOpen) => {
        setEditOpen(isOpen);
        if (!isOpen) resetEditForm();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-[#8C6D45]" />
              Editar Fornecedor & Contrato
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4 mt-2">
            <div>
              <Label className="text-xs font-semibold text-zinc-600 mb-1 block">Nome / Empresa</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Nome da Empresa / Profissional"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-zinc-600 mb-1 block">Categoria</Label>
              <Input
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                placeholder="Categoria (ex: Buffet, Foto)"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-zinc-600 mb-1 block">Contato</Label>
              <Input
                value={editForm.contact}
                onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                placeholder="Telefone ou Email de contato"
              />
            </div>

            {/* Gestão do Contrato no Modal de Edição */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold text-zinc-600">Contrato do Fornecedor</Label>
                <div className="flex gap-2 text-xs">
                  <Button
                    type="button"
                    variant={editContractMode === "file" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditContractMode("file")}
                    className="h-6 px-2 text-xs rounded"
                  >
                    Anexar Arquivo
                  </Button>
                  <Button
                    type="button"
                    variant={editContractMode === "url" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditContractMode("url")}
                    className="h-6 px-2 text-xs rounded"
                  >
                    Link Web (URL)
                  </Button>
                </div>
              </div>

              {editContractMode === "file" ? (
                <div className="border-2 border-dashed border-zinc-200 rounded-lg p-3 text-center relative hover:bg-zinc-50 transition">
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="application/pdf,image/*,.doc,.docx"
                    onChange={(e) => handleFileChange(e, true)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm">
                    <Upload className="w-4 h-4 text-zinc-400" />
                    <span>{editFileName ? editFileName : "Clique para alterar PDF ou Imagem"}</span>
                  </div>
                </div>
              ) : (
                <Input
                  value={editForm.contractUrl}
                  onChange={(e) => setEditForm({ ...editForm, contractUrl: e.target.value })}
                  placeholder="https://exemplo.com/contrato.pdf"
                  type="url"
                />
              )}
            </div>

            <div>
              <Label className="text-xs font-semibold text-zinc-600 mb-1 block">Observações</Label>
              <Input
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Observações do contrato ou fornecedor"
              />
            </div>

            <Button type="submit" className="w-full bg-[#8C6D45] hover:bg-[#755630] text-white" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Alterações"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

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
