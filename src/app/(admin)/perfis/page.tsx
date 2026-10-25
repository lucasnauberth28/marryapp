import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getRoles } from "@/actions/rbac-actions";
import { obterSessao } from "@/lib/security/auth-guard";
import { ehAcessoDeAdminDaPlataforma } from "@/lib/permissions";
import { RolesClient } from "./roles-client";

export const metadata: Metadata = {
  title: "Perfis de acesso",
  description: "Gerenciar perfis de acesso do sistema",
};

export default async function RolesPage() {
  // A administração da plataforma usa a tela nova (/admin/usuarios, aba Perfis); a antiga segue para quem só tem o módulo Perfis
  const session = await obterSessao();
  if (session && ehAcessoDeAdminDaPlataforma(session.allowedPaths)) redirect("/admin/usuarios?aba=perfis");

  const roles = await getRoles();

  return (
    <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <RolesClient initialRoles={roles} />
    </div>
  );
}
