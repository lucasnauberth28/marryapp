import { CabecalhoDaPagina } from "@/components/plataforma/page-header";
import { NavegacaoDeAbas } from "@/components/plataforma/tabs-nav";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { type ParametrosDeBusca, umDosValores } from "@/lib/platform/list-params";
import { obterPerfis, obterPessoas } from "@/actions/rbac-actions";
import { PessoasCliente } from "@/app/(admin)/usuarios/pessoas-cliente";
import { PerfisCliente } from "@/app/(admin)/perfis/perfis-cliente";

export const metadata = { title: "Usuários e perfis" };

/**
 * Usuários e perfis de acesso numa tela só (antes /usuarios e /perfis). As telas e as Server Actions são as mesmas de
 * antes (rbac-actions, com as mesmas permissões e travas de escalada de privilégio); aqui só mudam o shell e as abas.
 */
export default async function Page({ searchParams }: { searchParams: Promise<ParametrosDeBusca> }) {
  await exigirAdminDaPlataformaNaPagina(); // guard da página (o layout sozinho não basta)
  const query = await searchParams;
  const aba = umDosValores(query, "aba", ["usuarios", "perfis"] as const) ?? "usuarios";
  const [users, roles] = await Promise.all([aba === "usuarios" ? obterPessoas() : Promise.resolve([]), obterPerfis()]);

  return (
    <>
      <CabecalhoDaPagina eyebrow="Sistema" title="Usuários e perfis" description={aba === "usuarios" ? "Quem entra no painel e o que cada pessoa pode ver." : "Cada perfil define quais áreas do painel a pessoa pode abrir."} />
      <NavegacaoDeAbas
        label="Acesso"
        basePath="/admin/usuarios"
        active={aba}
        tabs={[
          { value: "usuarios", label: "Usuários" },
          { value: "perfis", label: "Perfis de acesso", count: roles.length },
        ]}
      />
      {aba === "usuarios" ? <PessoasCliente initialUsers={users} roles={roles} embedded /> : <PerfisCliente initialRoles={roles} embedded />}
    </>
  );
}
