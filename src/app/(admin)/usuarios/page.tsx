import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUsers, getRoles } from "@/actions/rbac-actions";
import { getSession } from "@/lib/security/auth-guard";
import { ehAcessoDeAdminDaPlataforma } from "@/lib/permissions";
import { UsersClient } from "./users-client";

export const metadata: Metadata = {
  title: "Usuários",
  description: "Gerenciar usuários do sistema",
};

export default async function UsersPage() {
  // A administração da plataforma usa a tela nova (/admin/usuarios); a antiga segue para quem só tem o módulo Usuários
  const session = await getSession();
  if (session && ehAcessoDeAdminDaPlataforma(session.allowedPaths)) redirect("/admin/usuarios");

  const [users, roles] = await Promise.all([
    getUsers(),
    getRoles()
  ]);

  return (
    <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <UsersClient initialUsers={users} roles={roles} />
    </div>
  );
}
