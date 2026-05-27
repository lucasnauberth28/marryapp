import { Metadata } from "next";
import { getUsers, getRoles } from "@/actions/rbac-actions";
import { UsersClient } from "./users-client";

export const metadata: Metadata = {
  title: "Usuários | Lucas & Giovanna",
  description: "Gerenciar usuários do sistema",
};

export default async function UsersPage() {
  const [users, roles] = await Promise.all([
    getUsers(),
    getRoles()
  ]);

  return (
    <div className="flex-1 p-8 pt-6 w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <UsersClient initialUsers={users} roles={roles} />
    </div>
  );
}
