"use client";
import { useRouter } from "next/navigation";
import { useSyncedState } from "@/hooks/use-synced-state";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { createUser, updateUser, deleteUser } from "@/actions/rbac-actions";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { AccessTabs } from "@/components/casal/access-tabs";
import { btn } from "@/components/landing/styles";
import { Chip, card, cardTitle } from "@/components/casal/ui";

interface UserItem {
  id: string;
  name: string;
  username: string;
  roleId: string;
  role?: { name: string } | null;
}

interface RoleOption {
  id: string;
  name: string;
}

export function UsersClient({ initialUsers, roles }: { initialUsers: UserItem[], roles: RoleOption[] }) {
  const [isPending, startTransition] = useTransition();
  const uid = useId();
  const router = useRouter();
  const [users] = useSyncedState(initialUsers);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    roleId: "",
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  function openNewForm() {
    setEditingUser(null);
    setFormData({ name: "", username: "", password: "", roleId: roles[0]?.id || "" });
    setIsFormOpen(true);
  }

  function openEditForm(user: UserItem) {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      password: "", // senha não vem do banco, campo fica vazio
      roleId: user.roleId,
    });
    setIsFormOpen(true);
  }

  async function handleSave() {
    if (!formData.name || !formData.username || !formData.roleId) {
      return toast.error("Preencha nome, login e perfil.");
    }
    if (!editingUser && !formData.password) {
      return toast.error("Defina uma senha para o novo usuário.");
    }

    const toastId = toast.loading(editingUser ? "Salvando o usuário..." : "Criando o usuário...");
    startTransition(async () => {
      let result;
      if (editingUser) {
        result = await updateUser(editingUser.id, formData);
      } else {
        result = await createUser(formData);
      }

      if (result.success) {
        toast.success(editingUser ? "Usuário atualizado." : "Usuário criado.", {
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
      const toastId = toast.loading("Excluindo o usuário...");
      startTransition(async () => {
        const result = await deleteUser(id);
        if (result.success) {
          toast.success("Usuário excluído.", { id: toastId });
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

  const labelCls = "text-sm font-semibold text-tinta";
  const inputCls = "min-h-11 rounded-xl sm:min-h-10";

  const roleChip = (user: UserItem) => <Chip tone="neutro" className="text-tinta">{user.role?.name || "Sem perfil"}</Chip>;
  const rowActions = (user: UserItem) => (
    <div className="flex justify-end gap-1">
      <button type="button" aria-label={`Editar ${user.name}`} className={`${btn.quiet} !min-w-11 !px-0`} onClick={() => openEditForm(user)}>
        <Pencil className="size-4" aria-hidden="true" />
      </button>
      <button type="button" aria-label={`Excluir ${user.name}`} className={`${btn.quiet} !min-w-11 !px-0 text-perigo hover:bg-perigo-suave`} onClick={() => handleDelete(user.id)}>
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Acesso"
        title="Usuários e perfis"
        description="Quem entra no painel e o que cada pessoa pode ver."
        actions={
          !isFormOpen && (
            <button type="button" onClick={openNewForm} className={btn.primary}>
              <Plus className="size-4" aria-hidden="true" /> Novo usuário
            </button>
          )
        }
      />
      <AccessTabs current="usuarios" />

      {isFormOpen ? (
        <section aria-labelledby={`${uid}-titulo`} className={`${card} flex flex-col gap-5 p-5 sm:p-6`}>
          <div>
            <h2 id={`${uid}-titulo`} className={cardTitle}>{editingUser ? "Editar usuário" : "Novo usuário"}</h2>
            <p className="mt-0.5 text-[15px] text-tinta-suave">
              {editingUser ? "Altere os dados ou defina uma senha nova." : "Crie um acesso para uma pessoa da equipe."}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${uid}-name`} className={labelCls}>Nome completo</label>
              <Input
                id={`${uid}-name`}
                placeholder="Ex.: João da Silva"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${uid}-username`} className={labelCls}>Login</label>
              <Input
                id={`${uid}-username`}
                placeholder="Ex.: joao.silva"
                autoCapitalize="none"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${uid}-password`} className={labelCls}>
                Senha {editingUser && <span className="font-normal text-tinta-suave">(deixe em branco para não mudar)</span>}
              </label>
              <Input
                id={`${uid}-password`}
                type="password"
                autoComplete="new-password"
                placeholder="Pelo menos 8 caracteres"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${uid}-role`} className={labelCls}>Perfil de acesso</label>
              <Select value={formData.roleId} onValueChange={(value) => setFormData({ ...formData, roleId: value })}>
                <SelectTrigger id={`${uid}-role`} className="min-h-11 w-full rounded-xl sm:min-h-10">
                  <SelectValue placeholder="Escolha um perfil" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-linha pt-4">
            <button type="button" className={btn.secondary} onClick={() => setIsFormOpen(false)} disabled={isPending}>
              Cancelar
            </button>
            <button type="button" className={btn.primary} onClick={handleSave} disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar usuário"}
            </button>
          </div>
        </section>
      ) : (
        <DataTable
          data={users}
          pageSize={15}
          keyExtractor={(u) => u.id}
          searchPlaceholder="Buscar por nome ou login"
          emptyMessage="Nenhum usuário ainda. Crie o primeiro acesso."
          mobileCard={(user) => (
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1.5">
                <strong className="font-semibold text-tinta">{user.name}</strong>
                <span className="truncate text-sm text-tinta-suave">@{user.username}</span>
                {roleChip(user)}
              </div>
              {rowActions(user)}
            </div>
          )}
          columns={[
            {
              key: "name",
              header: "Usuário",
              sortable: true,
              accessor: (u) => `${u.name} ${u.username}`,
              cell: (user) => (
                <div className="flex flex-col">
                  <strong className="font-semibold text-tinta">{user.name}</strong>
                  <span className="text-sm text-tinta-suave">@{user.username}</span>
                </div>
              ),
            },
            {
              key: "role",
              header: "Perfil",
              sortable: true,
              accessor: (u) => u.role?.name || "Sem perfil",
              cell: (user) => roleChip(user),
            },
            {
              key: "actions",
              header: "Ações",
              sortable: false,
              searchable: false,
              className: "text-right pr-4",
              headerClassName: "text-right pr-4",
              cell: (user) => rowActions(user),
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
        title="Excluir usuário"
        description="Tem certeza de que deseja excluir este usuário? O acesso dele acaba na hora."
      />
    </div>
  );
}
