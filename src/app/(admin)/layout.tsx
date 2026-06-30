// src/app/(admin)/layout.tsx
import { Sidebar } from "@/components/admin/sidebar"
import { Header } from "@/components/admin/header"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("marryapp_admin_session")?.value;
  
  let role = "Admin";
  let allowedPaths = ["*"];

  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      role = payload.role;
      allowedPaths = payload.allowedPaths;
    }
  }

  return (
    <div className="flex min-h-screen bg-zinc-50/50">
      <Sidebar role={role} allowedPaths={allowedPaths} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header role={role} allowedPaths={allowedPaths} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}