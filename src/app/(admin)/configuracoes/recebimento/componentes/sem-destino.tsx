import { Botao } from "@/components/ui/button";
import { Cartao, CabecalhoDoCartao, ConteudoDoCartao, DescricaoDoCartao, TituloDoCartao } from "@/components/ui/card";

export function SemDestinoParaCadastrar({ registrationAvailable, aoCadastrar }: { registrationAvailable: boolean; aoCadastrar: () => void }) {
  return (
    <Cartao className="gap-4">
      <CabecalhoDoCartao>
        <TituloDoCartao>Nenhum destino cadastrado</TituloDoCartao>
        <DescricaoDoCartao>Cadastre uma chave Pix ou uma conta em nome de uma pessoa ou empresa do casal.</DescricaoDoCartao>
      </CabecalhoDoCartao>
      <ConteudoDoCartao className="flex flex-col gap-3">
        {!registrationAvailable && (
          <p role="status" className="rounded-xl border border-aviso/40 bg-aviso-suave px-4 py-3 text-sm leading-5 text-tinta">
            O cadastro ainda não foi liberado. A equipe do Aceito está terminando a configuração de segurança; volte em breve.
          </p>
        )}
        <div>
          <Botao onClick={aoCadastrar} disabled={!registrationAvailable}>
            Cadastrar onde receber
          </Botao>
        </div>
      </ConteudoDoCartao>
    </Cartao>
  );
}

export function SemDestinoSomenteLeitura() {
  return (
    <Cartao className="gap-2">
      <CabecalhoDoCartao>
        <TituloDoCartao>Nenhum destino cadastrado</TituloDoCartao>
        <DescricaoDoCartao>O casal ainda não informou onde receber os presentes.</DescricaoDoCartao>
      </CabecalhoDoCartao>
    </Cartao>
  );
}
