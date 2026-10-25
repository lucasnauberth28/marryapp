"use client";
// Os perfis de acesso: quais áreas do painel cada perfil pode abrir.
import { CabecalhoDoAcesso } from "@/components/casal/acesso/cabecalho-do-acesso";
import { ModalDeConfirmacao } from "@/components/ui/confirm-modal";
import { useEstadoSincronizado } from "@/hooks/use-synced-state";
import { FormularioDoPerfil } from "./componentes/formulario-do-perfil";
import { TabelaDePerfis } from "./componentes/tabela-de-perfis";
import type { ItemDePerfil } from "./componentes/tipos";
import { usePerfis } from "./componentes/use-perfis";

/** `embedded`: dentro do shell /admin (as abas e o cabeçalho vêm da página); sem ele, a tela antiga. */
export function PerfisCliente({ initialRoles, embedded = false }: { initialRoles: ItemDePerfil[]; embedded?: boolean }) {
  const [roles] = useEstadoSincronizado(initialRoles);
  const g = usePerfis();
  return (
    <div className="flex flex-col gap-6">
      <CabecalhoDoAcesso embedded={embedded} formularioAberto={g.formAberto} aba="perfis" descricao="Cada perfil define quais áreas do painel a pessoa pode abrir." rotuloDoBotao="Novo perfil" aoNovo={() => g.abrir(null)} />
      {g.formAberto ? <FormularioDoPerfil g={g} /> : <TabelaDePerfis perfis={roles} g={g} />}
      <ModalDeConfirmacao
        isOpen={g.exclusao.aberto}
        onClose={g.exclusao.fechar}
        onConfirm={g.exclusao.confirmar}
        title="Excluir perfil"
        description="Tem certeza de que deseja excluir este perfil? Quem usa esse perfil pode perder o acesso."
      />
    </div>
  );
}
