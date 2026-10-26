import type { SecaoLegal } from "@/components/legal/legal-page";
import { CONTROLADOR, EMAIL_DO_ENCARREGADO } from "./comuns";

export const secoesDeColeta: SecaoLegal[] = [
  {
    id: "quem-somos",
    title: "Quem cuida dos seus dados",
    body: (
      <>
        <p>
          O Aceito é uma plataforma para organizar casamentos: site do casal, lista de convidados, confirmações de presença, lista de
          presentes e uma vitrine de fornecedores. O controlador dos dados pessoais tratados na plataforma é {CONTROLADOR} (&quot;Aceito&quot;,
          &quot;nós&quot;).
        </p>
        <p>
          O nosso encarregado pelo tratamento de dados pessoais (DPO) pode ser contatado pelo e-mail {EMAIL_DO_ENCARREGADO}.
        </p>
        <p>
          <strong>Papel do casal.</strong> Quando o casal cadastra convidados no Aceito, ele decide quem convidar e quais dados informar.
          Para esses dados, o casal atua como controlador e o Aceito trata as informações em nome dele, para oferecer as funções da
          plataforma. Mesmo assim, aplicamos a estes dados as mesmas proteções descritas aqui.
        </p>
      </>
    ),
  },
  {
    id: "dados-coletados",
    title: "Quais dados coletamos",
    body: (
      <>
        <p>
          <strong>Casais (e quem o casal convidar para organizar junto):</strong>
        </p>
        <ul>
          <li>Dados de cadastro: nome, e-mail, WhatsApp e senha (guardada apenas como hash, nunca em texto).</li>
          <li>
            Entrada com o Google, se você escolher: recebemos do Google apenas o seu nome, o e-mail (já confirmado por ele) e um identificador da conta
            Google. Não acessamos seus contatos, e-mails, agenda ou arquivos, e você pode desconectar o Google em Minha conta.
          </li>
          <li>
            Dados do casamento: nomes do casal, data, cidade, local, estimativa de convidados, textos, fotos e demais conteúdos publicados no
            site.
          </li>
          <li>
            Dados de organização: tarefas, cronograma, mesas, despesas, fornecedores contratados, cartões cadastrados para controle (apenas
            banco, bandeira, apelido e últimos dígitos, nunca o número completo) e saldo da carteira.
          </li>
          <li>Dados de assinatura: plano escolhido, valores, cupons e situação dos pagamentos.</li>
          <li>
            Dados de recebimento dos presentes, se o casal cadastrar: nome e CPF ou CNPJ do titular e a chave Pix ou os dados da conta
            bancária (banco, agência e conta). São guardados criptografados; a plataforma mostra só uma parte (por exemplo, o final da conta).
          </li>
        </ul>
        <p>
          <strong>Convidados:</strong>
        </p>
        <ul>
          <li>Dados informados pelo casal: nome, telefone, e-mail, categoria (ex.: família, amigos) e acompanhantes.</li>
          <li>
            Dados informados pelo próprio convidado: confirmação de presença, nomes de acompanhantes, restrições alimentares, recados no
            mural e fotos enviadas.
          </li>
          <li>Presentes: nome de quem presenteia, valor, forma de pagamento e situação do pagamento.</li>
          <li>Credenciamento no dia do evento: registro de entrada e horário.</li>
        </ul>
        <p>
          <strong>Fornecedores:</strong>
        </p>
        <ul>
          <li>
            Dados de cadastro: nome do responsável, e-mail, WhatsApp e senha (em hash) ou, se entrar com o Google, o nome, o e-mail e o identificador da
            conta Google.
          </li>
          <li>Dados do negócio: nome, categoria, CPF ou CNPJ (usado só na curadoria, não aparece no perfil), regiões atendidas, preços, redes sociais, fotos e descrição.</li>
          <li>Pedidos de orçamento recebidos, propostas, agenda, avaliações e estatísticas de visitas ao perfil.</li>
        </ul>
        <p>
          <strong>Casais que pedem orçamento a fornecedores:</strong> nome, telefone, e-mail, data, cidade, número de convidados, orçamento e
          mensagem, compartilhados com o fornecedor escolhido.
        </p>
        <p>
          <strong>Dados técnicos:</strong> endereço IP e horário de acesso (para segurança, prevenção a fraudes e limites de tentativas) e
          registros de ações administrativas.
        </p>
      </>
    ),
  },
  {
    id: "finalidades",
    title: "Para que usamos e com qual base legal",
    body: (
      <>
        <ul>
          <li>
            <strong>Prestar o serviço contratado</strong> (criar a conta, montar o site, enviar convites e lembretes, registrar confirmações,
            processar presentes, conectar casais e fornecedores): execução de contrato (art. 7º, V, da LGPD).
          </li>
          <li>
            <strong>Receber e repassar os presentes ao casal</strong> (guardar, de forma criptografada, o nome, o documento e a chave Pix
            ou a conta que o casal cadastra, e usá-los somente para fazer o repasse dos presentes e conferir a quem o dinheiro é devido):
            execução de contrato (art. 7º, V, da LGPD). Não usamos esses dados para outra finalidade, nem os mostramos inteiros em telas,
            e-mails ou registros.
          </li>
          <li>
            <strong>Cobrar planos e repassar presentes:</strong> execução de contrato e cumprimento de obrigação legal ou regulatória, como
            obrigações fiscais (art. 7º, II e V).
          </li>
          <li>
            <strong>Segurança da conta e prevenção a fraudes</strong> (limites de tentativas, registros de acesso, curadoria de
            fornecedores): legítimo interesse (art. 7º, IX) e garantia da prevenção à fraude (art. 11, II, &quot;g&quot;, quando aplicável).
          </li>
          <li>
            <strong>Mensagens de serviço</strong> por e-mail e WhatsApp (convite do par, redefinição de senha, avisos do casamento): execução
            de contrato. Não enviamos propaganda sem o seu consentimento.
          </li>
          <li>
            <strong>Restrições alimentares</strong> informadas por convidados podem revelar dados sensíveis (ex.: saúde ou religião). São
            usadas apenas para o casal e o buffet planejarem a refeição, com base no consentimento de quem informa (art. 11, I).
          </li>
          <li>
            <strong>Guardar registros de acesso</strong> pelo prazo do Marco Civil da Internet: obrigação legal (art. 7º, II).
          </li>
          <li>
            <strong>Exercer direitos</strong> em processos judiciais, administrativos ou arbitrais (art. 7º, VI).
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "compartilhamento",
    title: "Com quem compartilhamos",
    body: (
      <>
        <p>Não vendemos dados pessoais. Compartilhamos apenas o necessário com:</p>
        <ul>
          <li>
            <strong>Operadores que nos ajudam a prestar o serviço</strong>, sob contrato e com as mesmas obrigações de proteção:
            <ul>
              <li>Vercel (hospedagem da aplicação);</li>
              <li>Supabase (banco de dados e armazenamento de imagens);</li>
              <li>Mercado Pago (processamento de pagamentos via Pix e cartão);</li>
              <li>provedor de WhatsApp (envio de convites, lembretes e mensagens de serviço);</li>
              <li>Google (somente para quem escolhe entrar com a conta Google: confirma a identidade e informa nome e e-mail);</li>
              <li>provedor de e-mail transacional (envio de convites e de links para redefinir a senha).</li>
            </ul>
          </li>
          <li>
            <strong>Entre usuários, conforme o uso:</strong> o casal vê os dados dos próprios convidados; o fornecedor recebe os dados do
            pedido de orçamento enviado a ele; o site do casal mostra ao público o que o casal decidir publicar.
          </li>
          <li>
            <strong>Autoridades</strong>, quando houver obrigação legal ou ordem judicial.
          </li>
        </ul>
        <p>
          Alguns desses operadores podem armazenar dados fora do Brasil. Nesses casos, a transferência internacional segue o art. 33 da
          LGPD, com cláusulas contratuais e garantias adequadas de proteção.
        </p>
      </>
    ),
  },
];
