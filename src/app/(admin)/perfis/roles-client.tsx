"use client";
import { useRouter } from "next/navigation";
import { useSyncedState } from "@/hooks/use-synced-state";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { DataTable } from "@/components/ui/data-table";
import { createRole, updateRole, deleteRole } from "@/actions/rbac-actions";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { AccessTabs } from "@/components/casal/access-tabs";
import { btn } from "@/components/landing/styles";
import { card, cardTitle } from "@/components/casal/ui";

const AVAILABLE_MODULES = [
  { id: "*", name: "Acesso total" },
  { id: "/dashboard", name: "Início do painel" },
  { id: "/credenciamento", name: "Check-in no dia" },
  { id: "/convidados", name: "Lista de convidados" },
  { id: "/mesas", name: "Mesas" },
  { id: "/cronograma", name: "Cronograma do dia" },
  { id: "/fornecedores", name: "Encontrar fornecedores" },
  { id: "/meus-fornecedores", name: "Meus fornecedores" },
  { id: "/mensagens", name: "Mensagens" },
  { id: "/financas", name: "Finanças" },
  { id: "/carteira", name: "Carteira" },
  { id: "/despesas", name: "Despesas" },
  { id: "/presentes-admin", name: "Presentes" },
  { id: "/lua-de-mel", name: "Cotas de lua de mel" },
  { id: "/pendencias", name: "Tarefas" },
  { id: "/site-builder", name: "Editar o site" },
  { id: "/plano", name: "Plano e pagamentos do casal" },
  { id: "/configuracoes", name: "Configurações" },
  { id: "/usuarios", name: "Usuários" },
  { id: "/perfis", name: "Perfis de acesso" },
  { id: "/curadoria", name: "Curadoria de fornecedores (plataforma)" },
  { id: "/assinaturas", name: "Assinaturas e pagamentos (plataforma)" },
  { id: "/fornecedor", name: "Painel do fornecedor" },
];

interface RoleItem {
  id: string;
  name: string;
  allowedPaths: unknown; // coluna Json: array de paths
  _count?: { users: number };
}

function toPaths(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((p): p is string => typeof p === "string") : [];
}

export function RolesClient({ initialRoles }: { initialRoles: RoleItem[] }) {
  const [isPending, startTransition] = useTransition();
  const uid = useId();
  const router = useRouter();
  const [roles] = useSyncedState(initialRoles);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  
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

  function openEditForm(role: RoleItem) {
    setEditingRole(role);
    setFormData({
      name: role.name,
      allowedPaths: toPaths(role.allowedPaths),
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
    if (!formData.name) return toast.error("Dê um nome ao perfil.");
    if (formData.allowedPaths.length === 0) return toast.error("Marque ao menos uma área.");

    const toastId = toast.loading(editingRole ? "Salvando o perfil..." : "Criando o perfil...");
    startTransition(async () => {
      let result;
      if (editingRole) {
        result = await updateRole(editingRole.id, formData);
      } else {
        result = await createRole(formData);
      }

      if (result.success) {
        toast.success(editingRole ? "Perfil atualizado." : "Perfil criado.", {
          id: toastId,
        });
        router.refresh();
      } else {
        toast.error(result.error || "Erro ao realizar operação.", {
          id: toastId,
          duration: 6000,
          description: "Ocorreu um erro inesperado no servidor.",
        });
      }
    });
  }

  async function handleDelete(id: string) {
    setConfirmAction(() => () => {
      const toastId = toast.loading("Excluindo o perfil...");
      startTransition(async () => {
        const result = await deleteRole(id);
        if (result.success) {
          toast.success("Perfil excluído.", { id: toastId });
          router.refresh();
        } else {
          toast.error(result.error || "Erro ao realizar operação.", {
            id: toastId,
            duration: 6000,
            description: "Ocorreu um erro inesperado no servidor.",
          });
        }
      });
    });
    setConfirmOpen(true);
  }

  const pathsOf = (role: RoleItem) => toPaths(role.allowedPaths);
  const nameOf = (path: string) => AVAILABLE_MODULES.find((m) => m.id === path)?.name || path;
  const pathChips = (role: RoleItem) => (
    <div className="flex flex-wrap gap-1.5">
      {pathsOf(role).includes("*") ? (
        <span className="rounded-lg bg-ameixa-suave px-2.5 py-1 text-sm font-semibold text-ameixa">Acesso total</span>
      ) : (
        pathsOf(role).map((path) => (
          <span key={path} className="rounded-lg bg-areia px-2.5 py-1 text-sm text-tinta">
            {nameOf(path)}
          </span>
        ))
      )}
    </div>
  );
  const rowActions = (role: RoleItem) => (
    <div className="flex justify-end gap-1">
      <button type="button" aria-label={`Editar ${role.name}`} className={`${btn.quiet} !min-w-11 !px-0`} onClick={() => openEditForm(role)}>
        <Pencil className="size-4" aria-hidden="true" />
      </button>
      <button type="button" aria-label={`Excluir ${role.name}`} className={`${btn.quiet} !min-w-11 !px-0 text-perigo hover:bg-perigo-suave`} onClick={() => handleDelete(role.id)}>
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
  const usersLabel = (role: RoleItem) => {
    const n = role._count?.users || 0;
    return `${n} ${n === 1 ? "usuário" : "usuários"}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Acesso"
        title="Usuários e perfis"
        description="Cada perfil define quais áreas do painel a pessoa pode abrir."
        actions={
          !isFormOpen && (
            <button type="button" onClick={openNewForm} className={btn.primary}>
              <Plus className="size-4" aria-hidden="true" /> Novo perfil
            </button>
          )
        }
      />
      <AccessTabs current="perfis" />

      {isFormOpen ? (
        <section aria-labelledby={`${uid}-titulo`} className={`${card} flex flex-col gap-6 p-5 sm:p-6`}>
          <div>
            <h2 id={`${uid}-titulo`} className={cardTitle}>{editingRole ? "Editar perfil" : "Novo perfil"}</h2>
            <p className="mt-0.5 text-[15px] text-tinta-suave">Dê um nome ao perfil e marque as áreas que ele pode abrir.</p>
          </div>
          <div className="flex max-w-md flex-col gap-1.5">
            <label htmlFor={`${uid}-name`} className="text-sm font-semibold text-tinta">Nome do perfil</label>
            <Input
              id={`${uid}-name`}
              placeholder="Ex.: Cerimonialista, Financeiro"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="min-h-11 rounded-xl sm:min-h-10"
            />
          </div>

          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-semibold text-tinta">Áreas liberadas</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {AVAILABLE_MODULES.map((mod) => {
                const isSelected = formData.allowedPaths.includes(mod.id);
                return (
                  <button
                    type="button"
                    key={mod.id}
                    aria-pressed={isSelected}
                    onClick={() => togglePath(mod.id)}
                    className={`flex min-h-12 items-center justify-between gap-2 rounded-xl border p-3 text-left transition-colors ${
                      isSelected
                        ? "border-ameixa bg-ameixa text-on-ameixa"
                        : "border-linha-forte bg-papel text-tinta hover:border-ameixa hover:bg-ameixa-suave"
                    }`}
                  >
                    <span className="text-[15px] font-medium">{mod.name}</span>
                    {isSelected && <Check className="size-4 shrink-0" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-wrap justify-end gap-3 border-t border-linha pt-4">
            <button type="button" className={btn.secondary} onClick={() => setIsFormOpen(false)} disabled={isPending}>
              Cancelar
            </button>
            <button type="button" className={btn.primary} onClick={handleSave} disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar perfil"}
            </button>
          </div>
        </section>
      ) : (
        <DataTable
          data={roles}
          pageSize={15}
          keyExtractor={(r) => r.id}
          searchPlaceholder="Buscar perfil"
          emptyMessage="Nenhum perfil ainda. Crie o primeiro."
          mobileCard={(role) => (
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-2">
                <strong className="font-semibold text-tinta">{role.name}</strong>
                <span className="text-sm text-tinta-suave">{usersLabel(role)}</span>
                {pathChips(role)}
              </div>
              {rowActions(role)}
            </div>
          )}
          columns={[
            {
              key: "name",
              header: "Perfil",
              sortable: true,
              accessor: (r) => r.name,
              cell: (role) => <strong className="font-semibold text-tinta">{role.name}</strong>,
            },
            {
              key: "usersCount",
              header: "Usuários",
              sortable: true,
              accessor: (r) => r._count?.users || 0,
              cell: (role) => <span className="text-tinta-suave">{usersLabel(role)}</span>,
            },
            {
              key: "allowedPaths",
              header: "Áreas liberadas",
              sortable: true,
              accessor: (r) => (pathsOf(r).includes("*") ? "Acesso total" : pathsOf(r).map(nameOf).join(", ")),
              cell: (role) => pathChips(role),
            },
            {
              key: "actions",
              header: "Ações",
              sortable: false,
              searchable: false,
              className: "text-right pr-4",
              headerClassName: "text-right pr-4",
              cell: (role) => rowActions(role),
            },
          ]}
        />
      )}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          confirmAction?.();
        }}
        title="Excluir perfil"
        description="Tem certeza de que deseja excluir este perfil? Quem usa esse perfil pode perder o acesso."
      />
    </div>
  );
}
