"use client";
// As pessoas da equipe com acesso ao painel e o perfil de cada uma.
import { CabecalhoDoAcesso } from "@/components/casal/acesso/cabecalho-do-acesso";
import { ModalDeConfirmacao } from "@/components/ui/confirm-modal";
import { useEstadoSincronizado } from "@/hooks/use-synced-state";
import { FormularioDaPessoa } from "./componentes/formulario-da-pessoa";
import { TabelaDePessoas } from "./componentes/tabela-de-pessoas";
import type { ItemDePessoa, OpcaoDePerfil } from "./componentes/tipos";
import { usePessoas } from "./componentes/use-pessoas";

/** `embedded`: dentro do shell /admin (as abas e o cabeçalho vêm da página); sem ele, a tela antiga. */
export function PessoasCliente({ initialUsers, roles, embedded = false }: { initialUsers: ItemDePessoa[]; roles: OpcaoDePerfil[]; embedded?: boolean }) {
  const [users] = useEstadoSincronizado(initialUsers);
  const g = usePessoas(roles);
  return (
    <div className="flex flex-col gap-6">
      <CabecalhoDoAcesso embedded={embedded} formularioAberto={g.formAberto} aba="usuarios" descricao="Quem entra no painel e o que cada pessoa pode ver." rotuloDoBotao="Novo usuário" aoNovo={() => g.abrir(null)} />
      {g.formAberto ? <FormularioDaPessoa g={g} perfis={roles} /> : <TabelaDePessoas pessoas={users} g={g} />}
      <ModalDeConfirmacao
        isOpen={g.exclusao.aberto}
        onClose={g.exclusao.fechar}
        onConfirm={g.exclusao.confirmar}
        title="Excluir usuário"
        description="Tem certeza de que deseja excluir este usuário? O acesso dele acaba na hora."
      />
    </div>
  );
}
