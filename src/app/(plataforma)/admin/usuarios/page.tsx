import { PageHeader } from "@/components/plataforma/page-header";
import { TabsNav } from "@/components/plataforma/tabs-nav";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { type SearchParams, oneOf } from "@/lib/platform/list-params";
import { getRoles, getUsers } from "@/actions/rbac-actions";
import { UsersClient } from "@/app/(admin)/usuarios/users-client";
import { RolesClient } from "@/app/(admin)/perfis/roles-client";

export const metadata = { title: "Usuários e perfis" };

/**
 * Usuários e perfis de acesso numa tela só (antes /usuarios e /perfis). As telas e as Server Actions são as mesmas de
 * antes (rbac-actions, com as mesmas permissões e travas de escalada de privilégio); aqui só mudam o shell e as abas.
 */
export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await exigirAdminDaPlataformaNaPagina(); // guard da página (o layout sozinho não basta)
  const query = await searchParams;
  const aba = oneOf(query, "aba", ["usuarios", "perfis"] as const) ?? "usuarios";
  const [users, roles] = await Promise.all([aba === "usuarios" ? getUsers() : Promise.resolve([]), getRoles()]);

  return (
    <>
      <PageHeader eyebrow="Sistema" title="Usuários e perfis" description={aba === "usuarios" ? "Quem entra no painel e o que cada pessoa pode ver." : "Cada perfil define quais áreas do painel a pessoa pode abrir."} />
      <TabsNav
        label="Acesso"
        basePath="/admin/usuarios"
        active={aba}
        tabs={[
          { value: "usuarios", label: "Usuários" },
          { value: "perfis", label: "Perfis de acesso", count: roles.length },
        ]}
      />
      {aba === "usuarios" ? <UsersClient initialUsers={users} roles={roles} embedded /> : <RolesClient initialRoles={roles} embedded />}
    </>
  );
}
