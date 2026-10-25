import { Metadata } from "next";
import { redirect } from "next/navigation";
import { obterPessoas, obterPerfis } from "@/actions/rbac-actions";
import { obterSessao } from "@/lib/security/auth-guard";
import { ehAcessoDeAdminDaPlataforma } from "@/lib/permissions";
import { PessoasCliente } from "./users-client";

export const metadata: Metadata = {
  title: "Usuários",
  description: "Gerenciar usuários do sistema",
};

export default async function UsersPage() {
  // A administração da plataforma usa a tela nova (/admin/usuarios); a antiga segue para quem só tem o módulo Usuários
  const session = await obterSessao();
  if (session && ehAcessoDeAdminDaPlataforma(session.allowedPaths)) redirect("/admin/usuarios");

  const [users, roles] = await Promise.all([
    obterPessoas(),
    obterPerfis()
  ]);

  return (
    <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PessoasCliente initialUsers={users} roles={roles} />
    </div>
  );
}
