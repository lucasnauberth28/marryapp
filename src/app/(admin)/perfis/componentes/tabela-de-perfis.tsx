import { AcoesDaLinha } from "@/components/casal/acesso/acoes-da-linha";
import { TabelaDeDados } from "@/components/ui/data-table";
import { nomeDoModulo, paraCaminhos, rotuloDeUsuarios, type ItemDePerfil } from "./tipos";
import type { GestaoDePerfis } from "./use-perfis";

function AreasDoPerfil({ role }: { role: ItemDePerfil }) {
  const paths = paraCaminhos(role.allowedPaths);
  return (
    <div className="flex flex-wrap gap-1.5">
      {paths.includes("*") ? (
        <span className="rounded-lg bg-ameixa-suave px-2.5 py-1 text-sm font-semibold text-ameixa">Acesso total</span>
      ) : (
        paths.map((path) => (
          <span key={path} className="rounded-lg bg-areia px-2.5 py-1 text-sm text-tinta">
            {nomeDoModulo(path)}
          </span>
        ))
      )}
    </div>
  );
}

export function TabelaDePerfis({ perfis, g }: { perfis: ItemDePerfil[]; g: GestaoDePerfis }) {
  const acoes = (role: ItemDePerfil) => <AcoesDaLinha rotuloEditar={`Editar ${role.name}`} rotuloExcluir={`Excluir ${role.name}`} aoEditar={() => g.abrir(role)} aoExcluir={() => g.excluir(role.id)} />;
  const textoDasAreas = (r: ItemDePerfil) => (paraCaminhos(r.allowedPaths).includes("*") ? "Acesso total" : paraCaminhos(r.allowedPaths).map(nomeDoModulo).join(", "));
  return (
    <TabelaDeDados
      data={perfis}
      pageSize={15}
      keyExtractor={(r) => r.id}
      searchPlaceholder="Buscar perfil"
      emptyMessage="Nenhum perfil ainda. Crie o primeiro."
      mobileCard={(role) => (
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <strong className="font-semibold text-tinta">{role.name}</strong>
            <span className="text-sm text-tinta-suave">{rotuloDeUsuarios(role)}</span>
            <AreasDoPerfil role={role} />
          </div>
          {acoes(role)}
        </div>
      )}
      columns={[
        { key: "name", header: "Perfil", sortable: true, accessor: (r) => r.name, cell: (role) => <strong className="font-semibold text-tinta">{role.name}</strong> },
        { key: "usersCount", header: "Usuários", sortable: true, accessor: (r) => r._count?.users || 0, cell: (role) => <span className="text-tinta-suave">{rotuloDeUsuarios(role)}</span> },
        { key: "allowedPaths", header: "Áreas liberadas", sortable: true, accessor: textoDasAreas, cell: (role) => <AreasDoPerfil role={role} /> },
        { key: "actions", header: "Ações", sortable: false, searchable: false, className: "text-right pr-4", headerClassName: "text-right pr-4", cell: acoes },
      ]}
    />
  );
}
