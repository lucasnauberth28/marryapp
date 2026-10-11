import { redirect } from "next/navigation";

// A curadoria mudou para a administração da plataforma (/admin/fornecedores/curadoria); o endereço antigo só redireciona.
export default function CuradoriaPage() {
  redirect("/admin/fornecedores/curadoria");
}
