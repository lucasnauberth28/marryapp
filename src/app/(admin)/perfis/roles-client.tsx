"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { createRole, updateRole, deleteRole } from "@/actions/rbac-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Plus, Edit2, Trash2, Check, X, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const AVAILABLE_MODULES = [
  { id: "*", name: "Acesso Total (Super Admin)" },
  { id: "/dashboard", name: "Dashboard" },
  { id: "/convidados", name: "Convidados" },
  { id: "/mesas", name: "Mesas" },
  { id: "/financas", name: "Finanças" },
  { id: "/presentes-admin", name: "Presentes" },
  { id: "/pendencias", name: "Pendências" },
  { id: "/mensagens", name: "Mensagens" },
  { id: "/configuracoes", name: "Configurações Globais" },
  { id: "/usuarios", name: "Gestão de Usuários" },
  { id: "/perfis", name: "Gestão de Perfis" },
];

export function RolesClient({ initialRoles }: { initialRoles: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [roles, setRoles] = useState(initialRoles);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    allowedPaths: [] as string[],
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  function openNewForm() {
    setEditingRole(null);
    setFormData({ name: "", allowedPaths: [] });
    setIsFormOpen(true);
  }

  function openEditForm(role: any) {
    setEditingRole(role);
    setFormData({
      name: role.name,
      allowedPaths: role.allowedPaths || [],
    });
    setIsFormOpen(true);
  }

  function togglePath(path: string) {
    setFormData(prev => {
      // Se for Acesso Total, limpa os outros ou seleciona só ele
      if (path === "*") {
        return { ...prev, allowedPaths: prev.allowedPaths.includes("*") ? [] : ["*"] };
      }
      
      const newPaths = prev.allowedPaths.includes(path)
        ? prev.allowedPaths.filter(p => p !== path)
        : [...prev.allowedPaths.filter(p => p !== "*"), path];
        
      return { ...prev, allowedPaths: newPaths };
    });
  }

  async function handleSave() {
    if (!formData.name) return toast.error("O nome do perfil é obrigatório.");
    if (formData.allowedPaths.length === 0) return toast.error("Selecione ao menos um módulo.");

    startTransition(async () => {
      let result;
      if (editingRole) {
        result = await updateRole(editingRole.id, formData);
      } else {
        result = await createRole(formData);
      }

      if (result.success) {
        // Recarregar a página para pegar os dados frescos do servidor
        window.location.reload();
      } else {
        toast.error(result.error);
      }
    });
  }

  async function handleDelete(id: string) {
    setConfirmAction(() => () => {
      startTransition(async () => {
        const result = await deleteRole(id);
        if (result.success) {
          window.location.reload();
        } else {
          toast.error(result.error);
        }
      });
    });
    setConfirmOpen(true);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#8C6D45] font-serif italic tracking-tight">
            Perfis de Acesso (Roles)
          </h1>
          <p className="text-zinc-500 mt-1">
            Crie perfis e defina quais páginas cada um pode acessar.
          </p>
        </div>
        {!isFormOpen && (
          <Button onClick={openNewForm} className="bg-zinc-900 text-white hover:bg-zinc-800">
            <Plus className="w-4 h-4 mr-2" />
            Novo Perfil
          </Button>
        )}
      </div>

      {isFormOpen ? (
        <Card className="border-zinc-200/60 shadow-sm animate-in zoom-in-95 duration-200">
          <CardHeader>
            <CardTitle>{editingRole ? "Editar Perfil" : "Criar Novo Perfil"}</CardTitle>
            <CardDescription>Defina o nome do perfil e marque as páginas permitidas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Nome do Perfil</label>
              <Input
                placeholder="Ex: Cerimonialista, Financeiro..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="max-w-md"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-700">Módulos Permitidos</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {AVAILABLE_MODULES.map((mod) => {
                  const isSelected = formData.allowedPaths.includes(mod.id);
                  return (
                    <button
                      key={mod.id}
                      onClick={() => togglePath(mod.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "bg-zinc-900 border-zinc-900 text-white"
                          : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
                      }`}
                    >
                      <span className="text-sm font-medium">{mod.name}</span>
                      {isSelected && <Check className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-zinc-100">
              <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isPending}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isPending} className="bg-zinc-900 text-white">
                {isPending ? "Salvando..." : "Salvar Perfil"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <Card key={role.id} className="border-zinc-200/60 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-zinc-400" />
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-600" onClick={() => openEditForm(role)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-600" onClick={() => handleDelete(role.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>{role._count?.users || 0} usuário(s) vinculados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {role.allowedPaths.includes("*") ? (
                    <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md font-medium border border-zinc-200">
                      Acesso Total
                    </span>
                  ) : (
                    role.allowedPaths.map((path: string) => (
                      <span key={path} className="text-xs bg-zinc-50 text-zinc-500 px-2 py-1 rounded-md border border-zinc-100">
                        {AVAILABLE_MODULES.find(m => m.id === path)?.name || path}
                      </span>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {roles.length === 0 && (
             <div className="col-span-full py-12 text-center border-2 border-dashed border-zinc-200 rounded-2xl text-zinc-500">
               Nenhum perfil cadastrado.
             </div>
          )}
        </div>
      )}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          confirmAction?.();
        }}
        title="Excluir Perfil"
        description="Tem certeza que deseja excluir este perfil? Usuários vinculados podem perder acesso."
      />
    </div>
  );
}
