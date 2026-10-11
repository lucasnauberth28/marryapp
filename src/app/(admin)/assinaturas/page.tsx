import { redirect } from "next/navigation";

// Assinaturas e Pix e Cupons mudaram para a administração da plataforma (/admin/planos); o endereço antigo só redireciona.
export default async function AssinaturasPage({ searchParams }: { searchParams: Promise<{ aba?: string; status?: string; id?: string }> }) {
  const { aba, status, id } = await searchParams;
  if (aba === "cupons") redirect("/admin/planos/cupons");
  const query = new URLSearchParams();
  if (typeof status === "string" && /^[a-z-]{1,20}$/.test(status)) query.set("status", status);
  if (typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id)) query.set("id", id);
  const qs = query.toString();
  redirect(qs ? `/admin/planos/assinaturas?${qs}` : "/admin/planos/assinaturas");
}
