"use client";

import { useState, useTransition } from "react";
import { createUser, updateUser, deleteUser } from "@/actions/rbac-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Edit2, Trash2, KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function UsersClient({ initialUsers, roles }: { initialUsers: any[], roles: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [users, setUsers] = useState(initialUsers);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    roleId: "",
  });

  const [isFormOpen, setIsFormOpen] = useState(false);

  function openNewForm() {
    setEditingUser(null);
    setFormData({ name: "", username: "", password: "", roleId: roles[0]?.id || "" });
    setIsFormOpen(true);
  }

  function openEditForm(user: any) {
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
      return alert("Preencha todos os campos obrigatórios.");
    }
    if (!editingUser && !formData.password) {
      return alert("A senha é obrigatória para novos usuários.");
    }

    startTransition(async () => {
      let result;
      if (editingUser) {
        result = await updateUser(editingUser.id, formData);
      } else {
        result = await createUser(formData);
      }

      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error);
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este usuário? O acesso dele será revogado imediatamente.")) return;
    
    startTransition(async () => {
      const result = await deleteUser(id);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error);
      }
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-zinc-400" />
            Usuários
          </h2>
          <p className="text-zinc-500 mt-1">
            Gerencie quem tem acesso ao painel e defina seus perfis.
          </p>
        </div>
        {!isFormOpen && (
          <Button onClick={openNewForm} className="bg-zinc-900 text-white hover:bg-zinc-800">
            <Plus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        )}
      </div>

      {isFormOpen ? (
        <Card className="border-zinc-200/60 shadow-sm animate-in zoom-in-95 duration-200">
          <CardHeader>
            <CardTitle>{editingUser ? "Editar Usuário" : "Cadastrar Usuário"}</CardTitle>
            <CardDescription>
              {editingUser ? "Altere os dados ou redefina a senha." : "Crie um novo acesso para a equipe."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Nome Completo</label>
                <Input
                  placeholder="Ex: João da Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Login (Username)</label>
                <Input
                  placeholder="Ex: joao.silva"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">
                  Senha {editingUser && <span className="text-zinc-400 text-xs font-normal">(Deixe em branco para não alterar)</span>}
                </label>
                <Input
                  type="password"
                  placeholder="********"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Perfil de Acesso</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                >
                  <option value="" disabled>Selecione um perfil...</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-zinc-100">
              <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isPending}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isPending} className="bg-zinc-900 text-white">
                {isPending ? "Salvando..." : "Salvar Usuário"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/80 hover:bg-zinc-50/80">
                <TableHead className="font-semibold text-zinc-500 uppercase text-xs tracking-wider">Nome</TableHead>
                <TableHead className="font-semibold text-zinc-500 uppercase text-xs tracking-wider">Login</TableHead>
                <TableHead className="font-semibold text-zinc-500 uppercase text-xs tracking-wider">Perfil</TableHead>
                <TableHead className="font-semibold text-zinc-500 uppercase text-xs tracking-wider text-right pr-4">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-zinc-500">
                    Nenhum usuário cadastrado via banco de dados. <br />
                    (O acesso de emergência via .env continua funcionando)
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-zinc-50/60">
                    <TableCell className="font-medium text-zinc-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                          <KeyRound className="w-4 h-4 text-zinc-400" />
                        </div>
                        {user.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-600">@{user.username}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-zinc-50 font-medium">
                        {user.role?.name || "Sem Perfil"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-600" onClick={() => openEditForm(user)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-600" onClick={() => handleDelete(user.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
