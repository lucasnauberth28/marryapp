import { useId } from "react";
import { RodapeDoFormularioDeAcesso } from "@/components/casal/acesso/rodape-do-formulario";
import { estiloDoCartao, estiloDoTituloDoCartao } from "@/components/casal/ui";
import { Entrada } from "@/components/ui/input";
import { ConteudoDaSelecao, GatilhoDaSelecao, ItemDaSelecao, Selecao, ValorDaSelecao } from "@/components/ui/select";
import type { OpcaoDePerfil } from "./tipos";
import type { GestaoDePessoas } from "./use-pessoas";

export function FormularioDaPessoa({ g, perfis }: { g: GestaoDePessoas; perfis: OpcaoDePerfil[] }) {
  const uid = useId();
  const { formData, editing, mudar } = g;
  return (
    <section aria-labelledby={`${uid}-titulo`} className={`${estiloDoCartao} flex flex-col gap-5 p-5 sm:p-6`}>
      <div>
        <h2 id={`${uid}-titulo`} className={estiloDoTituloDoCartao}>{editing ? "Editar usuário" : "Novo usuário"}</h2>
        <p className="mt-0.5 text-[15px] text-tinta-suave">{editing ? "Altere os dados ou defina uma senha nova." : "Crie um acesso para uma pessoa da equipe."}</p>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Entrada id={`${uid}-name`} label="Nome completo" placeholder="Ex.: João da Silva" value={formData.name} onChange={(e) => mudar("name", e.target.value)} />
        <Entrada id={`${uid}-username`} label="Login" placeholder="Ex.: joao.silva" autoCapitalize="none" value={formData.username} onChange={(e) => mudar("username", e.target.value.toLowerCase())} />
        <Entrada id={`${uid}-password`} label="Senha" type="password" autoComplete="new-password" hint={editing ? "Deixe em branco para não mudar." : "Pelo menos 8 caracteres."} value={formData.password} onChange={(e) => mudar("password", e.target.value)} />
        <Selecao value={formData.roleId} onValueChange={(value) => mudar("roleId", value)}>
          <GatilhoDaSelecao id={`${uid}-role`} label="Perfil de acesso">
            <ValorDaSelecao />
          </GatilhoDaSelecao>
          <ConteudoDaSelecao>
            {perfis.map((r) => (
              <ItemDaSelecao key={r.id} value={r.id}>{r.name}</ItemDaSelecao>
            ))}
          </ConteudoDaSelecao>
        </Selecao>
      </div>
      <RodapeDoFormularioDeAcesso pendente={g.isPending} rotuloDeSalvar="Salvar usuário" aoCancelar={g.fecharFormulario} aoSalvar={g.salvar} />
    </section>
  );
}
