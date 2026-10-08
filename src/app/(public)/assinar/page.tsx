import { redirect } from "next/navigation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** O cadastro agora acontece na tela de acesso; links antigos para /assinar continuam valendo. */
export default async function AssinarPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const key of ["tipo", "plano", "custom", "modules"]) {
    const value = params[key];
    const v = Array.isArray(value) ? value[0] : value;
    if (v) query.set(key, v);
  }
  const qs = query.toString();
  redirect(qs ? `/cadastro?${qs}` : "/cadastro");
}
