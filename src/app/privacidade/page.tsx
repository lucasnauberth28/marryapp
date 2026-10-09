import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Placeholder, type LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Como o Aceito trata os dados de casais, convidados e fornecedores, de acordo com a LGPD.",
};

const CONTROLLER = (
  <>
    <Placeholder>[RAZÃO SOCIAL]</Placeholder>, inscrita no CNPJ sob o nº <Placeholder>[CNPJ]</Placeholder>, com sede em{" "}
    <Placeholder>[ENDEREÇO]</Placeholder>
  </>
);
const DPO_EMAIL = <Placeholder>[E-MAIL DO ENCARREGADO]</Placeholder>;

const sections: LegalSection[] = [
  {
    id: "quem-somos",
    title: "Quem cuida dos seus dados",
    body: (
      <>
        <p>
          O Aceito é uma plataforma para organizar casamentos: site do casal, lista de convidados, confirmações de presença, lista de
          presentes e uma vitrine de fornecedores. O controlador dos dados pessoais tratados na plataforma é {CONTROLLER} (&quot;Aceito&quot;,
          &quot;nós&quot;).
        </p>
        <p>
          O nosso encarregado pelo tratamento de dados pessoais (DPO) pode ser contatado pelo e-mail {DPO_EMAIL}.
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
            Dados do casamento: nomes do casal, data, cidade, local, estimativa de convidados, textos, fotos e demais conteúdos publicados no
            site.
          </li>
          <li>
            Dados de organização: tarefas, cronograma, mesas, despesas, fornecedores contratados, cartões cadastrados para controle (apenas
            banco, bandeira, apelido e últimos dígitos, nunca o número completo) e saldo da carteira.
          </li>
          <li>Dados de assinatura: plano escolhido, valores, cupons e situação dos pagamentos.</li>
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
          <li>Dados de cadastro: nome do responsável, e-mail, WhatsApp e senha (em hash).</li>
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
  {
    id: "retencao",
    title: "Por quanto tempo guardamos",
    body: (
      <>
        <ul>
          <li>Dados da conta e do casamento: enquanto a conta existir. Ao excluir a conta, apagamos os dados em até 30 dias, salvo as exceções abaixo.</li>
          <li>Registros de acesso à aplicação: 6 meses, como exige o Marco Civil da Internet (Lei 12.965/2014, art. 15).</li>
          <li>Dados de pagamentos e notas fiscais: pelo prazo exigido pela legislação fiscal e tributária (em geral, 5 anos).</li>
          <li>Cópias de segurança (backups) são sobrescritas periodicamente e podem manter dados por até <Placeholder>[PRAZO DOS BACKUPS]</Placeholder>.</li>
        </ul>
      </>
    ),
  },
  {
    id: "direitos",
    title: "Seus direitos e como exercê-los",
    body: (
      <>
        <p>Pela LGPD (art. 18), você pode, a qualquer momento:</p>
        <ul>
          <li>confirmar se tratamos seus dados e acessá-los;</li>
          <li>corrigir dados incompletos, inexatos ou desatualizados;</li>
          <li>pedir anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a lei;</li>
          <li>receber seus dados em formato estruturado (portabilidade);</li>
          <li>eliminar dados tratados com base no consentimento e revogar esse consentimento;</li>
          <li>saber com quem compartilhamos seus dados;</li>
          <li>opor-se a tratamentos feitos com base no legítimo interesse, quando cabível;</li>
          <li>pedir revisão de decisões tomadas apenas com base em tratamento automatizado.</li>
        </ul>
        <p>
          <strong>Pela própria plataforma:</strong> em <Link href="/conta">Minha conta</Link> você baixa uma cópia dos seus dados (JSON),
          troca a senha e exclui a conta. Dados do casamento e do perfil de fornecedor podem ser corrigidos direto no painel.
        </p>
        <p>
          <strong>Convidados</strong> podem pedir correção ou exclusão ao casal que os convidou ou diretamente ao encarregado, pelo e-mail{" "}
          {DPO_EMAIL}. Respondemos em até 15 dias. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies",
    body: (
      <>
        <p>
          Usamos apenas um cookie essencial de sessão, que mantém você conectado depois de entrar na conta. Ele é marcado como
          &quot;httpOnly&quot; (não pode ser lido por scripts), expira em até 7 dias e é apagado quando você sai.
        </p>
        <p>
          Não usamos cookies de publicidade nem de rastreamento de terceiros. Se isso mudar, atualizaremos esta política e pediremos o seu
          consentimento antes.
        </p>
      </>
    ),
  },
  {
    id: "seguranca",
    title: "Segurança",
    body: (
      <>
        <p>Adotamos medidas técnicas e administrativas para proteger os dados, entre elas:</p>
        <ul>
          <li>conexões criptografadas (HTTPS) em todo o site;</li>
          <li>senhas guardadas apenas como hash (bcrypt) e links de convite e de redefinição de senha guardados apenas como hash, com validade curta;</li>
          <li>limites de tentativas contra força bruta e separação dos dados de cada casamento;</li>
          <li>acesso administrativo restrito e registrado.</li>
        </ul>
        <p>
          Nenhum sistema é totalmente imune a incidentes. Se acontecer um incidente de segurança que possa causar risco ou dano relevante,
          avisaremos os titulares afetados e a ANPD, como determina a LGPD.
        </p>
      </>
    ),
  },
  {
    id: "criancas",
    title: "Crianças e adolescentes",
    body: (
      <>
        <p>
          As contas do Aceito são para maiores de 18 anos. Casais podem cadastrar crianças e adolescentes como convidados ou acompanhantes;
          nesse caso, informem apenas o necessário (em geral, o nome) e no melhor interesse deles, como pede o art. 14 da LGPD.
        </p>
      </>
    ),
  },
  {
    id: "alteracoes",
    title: "Alterações desta política",
    body: (
      <>
        <p>
          Podemos atualizar esta política para refletir mudanças no serviço ou na lei. A data no topo indica a última versão. Mudanças
          relevantes serão avisadas por e-mail ou na plataforma antes de entrarem em vigor.
        </p>
      </>
    ),
  },
  {
    id: "contato",
    title: "Contato",
    body: (
      <>
        <p>
          Dúvidas, pedidos ou reclamações sobre privacidade: escreva para o encarregado pelo e-mail {DPO_EMAIL}. Controlador: {CONTROLLER}.
        </p>
      </>
    ),
  },
];

export default function PrivacidadePage() {
  return (
    <LegalPage
      title="Política de privacidade"
      updatedAt={<Placeholder>[DATA DA PUBLICAÇÃO]</Placeholder>}
      intro={
        <p>
          Esta política explica, em linguagem direta, quais dados pessoais o Aceito trata, por que, com quem compartilha e como você exerce
          seus direitos pela Lei Geral de Proteção de Dados (Lei 13.709/2018, &quot;LGPD&quot;).
        </p>
      }
      sections={sections}
      related={{ href: "/termos", label: "Termos de uso" }}
    />
  );
}
