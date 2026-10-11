import { redirect } from "next/navigation";

// Os pedidos de domínio mudaram para a administração da plataforma (/admin/dominios); o endereço antigo só redireciona.
export default function DominiosPage() {
  redirect("/admin/dominios");
}
