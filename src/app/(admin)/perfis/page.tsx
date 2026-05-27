import { Metadata } from "next";
import { getRoles } from "@/actions/rbac-actions";
import { RolesClient } from "./roles-client";

export const metadata: Metadata = {
  title: "Perfis (Roles) | Lucas & Giovanna",
  description: "Gerenciar perfis de acesso do sistema",
};

export default async function RolesPage() {
  const roles = await getRoles();

  return (
    <div className="flex-1 p-8 pt-6 w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <RolesClient initialRoles={roles} />
    </div>
  );
}
