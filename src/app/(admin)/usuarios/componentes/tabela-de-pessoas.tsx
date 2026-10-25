import { AcoesDaLinha } from "@/components/casal/acesso/acoes-da-linha";
import { Etiqueta } from "@/components/casal/ui";
import { TabelaDeDados } from "@/components/ui/data-table";
import type { ItemDePessoa } from "./tipos";
import type { GestaoDePessoas } from "./use-pessoas";

const PerfilDaPessoa = ({ user }: { user: ItemDePessoa }) => <Etiqueta tone="neutro" className="text-tinta">{user.role?.name || "Sem perfil"}</Etiqueta>;

export function TabelaDePessoas({ pessoas, g }: { pessoas: ItemDePessoa[]; g: GestaoDePessoas }) {
  const acoes = (user: ItemDePessoa) => <AcoesDaLinha rotuloEditar={`Editar ${user.name}`} rotuloExcluir={`Excluir ${user.name}`} aoEditar={() => g.abrir(user)} aoExcluir={() => g.excluir(user.id)} />;
  return (
    <TabelaDeDados
      data={pessoas}
      pageSize={15}
      keyExtractor={(u) => u.id}
      searchPlaceholder="Buscar por nome ou login"
      emptyMessage="Nenhum usuário ainda. Crie o primeiro acesso."
      mobileCard={(user) => (
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <strong className="font-semibold text-tinta">{user.name}</strong>
            <span className="truncate text-sm text-tinta-suave">@{user.username}</span>
            <PerfilDaPessoa user={user} />
          </div>
          {acoes(user)}
        </div>
      )}
      columns={[
        {
          key: "name",
          header: "Usuário",
          sortable: true,
          accessor: (u) => `${u.name} ${u.username}`,
          cell: (user) => (
            <div className="flex flex-col">
              <strong className="font-semibold text-tinta">{user.name}</strong>
              <span className="text-sm text-tinta-suave">@{user.username}</span>
            </div>
          ),
        },
        { key: "role", header: "Perfil", sortable: true, accessor: (u) => u.role?.name || "Sem perfil", cell: (user) => <PerfilDaPessoa user={user} /> },
        { key: "actions", header: "Ações", sortable: false, searchable: false, className: "text-right pr-4", headerClassName: "text-right pr-4", cell: acoes },
      ]}
    />
  );
}
