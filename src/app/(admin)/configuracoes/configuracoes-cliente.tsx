"use client";
// Configurações do casamento: resumo, prazo de confirmação, aparência e atalhos para as outras telas.
import { CabecalhoDaPagina } from "@/components/admin/page-header";
import { Cartao, CabecalhoDoCartao, ConteudoDoCartao, DescricaoDoCartao, TituloDoCartao } from "@/components/ui/card";
import { SeletorSegmentadoDoTema } from "@/components/theme/theme-toggle";
import { CartaoDeConfiguracaoDoTour } from "@/components/tour/tour-restart";
import { CartaoComLink } from "./componentes/cartao-com-link";
import { CartaoDoCasamento, type ResumoDoCasamento } from "./componentes/cartao-do-casamento";
import { CartaoDoPrazo } from "./componentes/cartao-do-prazo";

interface PropriedadesDasConfiguracoesCliente {
  initialSettings: { rsvpDeadline: Date | string | null };
  summary: ResumoDoCasamento;
  canSeePlan: boolean;
}

function CartaoDaAparencia() {
  return (
    <Cartao className="gap-4">
      <CabecalhoDoCartao>
        <TituloDoCartao>Aparência</TituloDoCartao>
        <DescricaoDoCartao>Claro, escuro ou o do seu aparelho. Vale para este navegador e não muda o site do casamento, que fica sempre claro.</DescricaoDoCartao>
      </CabecalhoDoCartao>
      <ConteudoDoCartao>
        <SeletorSegmentadoDoTema />
      </ConteudoDoCartao>
    </Cartao>
  );
}

export function ConfiguracoesCliente({ initialSettings, summary, canSeePlan }: PropriedadesDasConfiguracoesCliente) {
  return (
    <div className="flex max-w-[880px] flex-col gap-6">
      <CabecalhoDaPagina eyebrow="Conta" title="Configurações" />
      <CartaoDoCasamento summary={summary} />
      <CartaoDoPrazo prazoInicial={initialSettings.rsvpDeadline} />
      <CartaoDaAparencia />
      <CartaoComLink titulo="Onde receber os presentes" descricao="A chave Pix ou a conta que vocês escolhem para receber o dinheiro dos presentes. Os dados ficam criptografados." href="/configuracoes/recebimento" rotulo="Cadastrar ou ver o destino" />
      <CartaoComLink titulo="WhatsApp" descricao="Conexão do número que envia convites e lembretes aos convidados." href="/configuracoes/whatsapp" rotulo="Gerenciar conexão" />
      <CartaoComLink titulo="Quem pode editar" descricao="Convite para a outra pessoa do casal, senha, avisos e exclusão da conta ficam em Minha conta." href="/conta" rotulo="Abrir Minha conta" />
      <CartaoDeConfiguracaoDoTour />
      {canSeePlan && <CartaoComLink titulo="Plano" descricao="Veja o plano do casamento, o que está incluído e os pagamentos." href="/plano" rotulo="Ver plano e pagamentos" />}
    </div>
  );
}
