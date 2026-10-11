import { redirect } from "next/navigation";

export const metadata = { title: "Registro de atividades" };

/** O registro de atividades agora vive em /admin/atividades (só a administração da plataforma lê). */
export default function AtividadesPage() {
  redirect("/admin/atividades");
}
