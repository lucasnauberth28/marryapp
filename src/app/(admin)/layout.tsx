// src/app/(admin)/layout.tsx
import { Sidebar } from "@/components/admin/sidebar"
import { Header } from "@/components/admin/header"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/security/auth-guard"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Perfil e permissões vêm do banco (não só do JWT), refletindo alterações de acesso na hora.
  const session = await getSession();
  if (!session) redirect("/login");

  const { role, allowedPaths } = session;

  return (
    <div className="flex min-h-screen bg-zinc-50/50">
      <Sidebar role={role} allowedPaths={allowedPaths} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header role={role} allowedPaths={allowedPaths} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}