import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Placeholder, type LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: "Regras de uso do Aceito para casais, convidados e fornecedores.",
};

const CONTROLLER = (
  <>
    <Placeholder>[RAZÃO SOCIAL]</Placeholder>, CNPJ <Placeholder>[CNPJ]</Placeholder>, com sede em <Placeholder>[ENDEREÇO]</Placeholder>
  </>
);
const CONTACT_EMAIL = <Placeholder>[E-MAIL DO ENCARREGADO]</Placeholder>;

const sections: LegalSection[] = [
  {
    id: "aceitacao",
    title: "Sobre estes termos",
    body: (
      <>
        <p>
          Estes termos regulam o uso do Aceito, plataforma oferecida por {CONTROLLER} (&quot;Aceito&quot;). Ao criar uma conta ou usar a
          plataforma, você declara que leu e concorda com estes termos e com a <Link href="/privacidade">Política de privacidade</Link>.
        </p>
        <p>Se não concordar, não use a plataforma. Convidados que só confirmam presença ou dão presentes não precisam de conta.</p>
      </>
    ),
  },
  {
    id: "servico",
    title: "O que o Aceito oferece",
    body: (
      <>
        <ul>
          <li>Para casais: site do casamento, lista de convidados, envio de convites e lembretes, confirmação de presença, lista de presentes com pagamento online, mesas, cronograma, finanças e tarefas.</li>
          <li>Para convidados: acesso ao site do casal, confirmação de presença, mural de recados e presentes.</li>
          <li>Para fornecedores: perfil na vitrine, recebimento de pedidos de orçamento, propostas, agenda e avaliações.</li>
        </ul>
        <p>
          As funções disponíveis dependem do plano contratado. Podemos melhorar, alterar ou descontinuar funções, avisando com antecedência
          quando a mudança afetar de forma relevante um plano pago em vigor.
        </p>
      </>
    ),
  },
  {
    id: "conta",
    title: "Sua conta",
    body: (
      <>
        <ul>
          <li>Você precisa ter 18 anos ou mais e informar dados verdadeiros.</li>
          <li>A senha é pessoal. Você responde pelo que for feito com a sua conta; avise-nos se suspeitar de uso indevido.</li>
          <li>
            O casal pode convidar o par para organizar o mesmo casamento. Cada pessoa tem a própria conta, e todos os membros têm acesso aos
            dados do casamento.
          </li>
          <li>
            Você pode excluir a conta a qualquer momento em <Link href="/conta">Minha conta</Link>. Se você for a última pessoa de um
            casamento, o casamento e seus dados são excluídos junto.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "responsabilidades-casal",
    title: "Responsabilidades do casal",
    body: (
      <>
        <ul>
          <li>
            Os dados dos convidados são cadastrados pelo casal. Cadastre apenas pessoas que vocês de fato vão convidar, com dados obtidos de
            forma legítima, e use-os só para o casamento.
          </li>
          <li>Mensagens enviadas pela plataforma (convites e lembretes) devem ser sobre o casamento. Não é permitido spam ou propaganda.</li>
          <li>O conteúdo publicado no site (textos, fotos, músicas, links) é de responsabilidade do casal, que garante ter os direitos de uso.</li>
        </ul>
      </>
    ),
  },
  {
    id: "fornecedores",
    title: "Regras para fornecedores",
    body: (
      <>
        <ul>
          <li>Todo perfil passa por curadoria antes de aparecer na vitrine. Podemos recusar, pedir ajustes ou remover perfis que não sigam estes termos.</li>
          <li>As informações do perfil (preços, regiões, fotos, documentos) devem ser verdadeiras e atuais.</li>
          <li>
            Os dados dos casais recebidos em pedidos de orçamento só podem ser usados para responder àquele pedido e prestar o serviço
            contratado. É proibido revendê-los ou usá-los para outras finalidades.
          </li>
          <li>
            O contrato do serviço de casamento é firmado diretamente entre o fornecedor e o casal. O Aceito não é parte desse contrato e não
            responde pela execução do serviço, preço ou qualidade.
          </li>
          <li>Avaliações devem refletir experiências reais. Respostas públicas devem ser respeitosas.</li>
        </ul>
      </>
    ),
  },
  {
    id: "pagamentos",
    title: "Planos, pagamentos e presentes",
    body: (
      <>
        <ul>
          <li>
            Planos de casal são pagos uma única vez; planos de fornecedor são mensais. Os preços ficam na página de planos. O plano é ativado
            depois da confirmação do pagamento.
          </li>
          <li>Os pagamentos são processados pelo Mercado Pago. O Aceito não armazena dados completos de cartão.</li>
          <li>
            Presentes em dinheiro pagos por convidados ficam na carteira do casal, descontadas as tarifas informadas na plataforma, e podem
            ser resgatados conforme as regras da carteira.
          </li>
          <li>
            Nas contratações pela internet, você pode desistir em até 7 dias da contratação, com reembolso integral, conforme o art. 49 do
            Código de Defesa do Consumidor. Pedidos de reembolso: <Placeholder>[CANAL DE ATENDIMENTO]</Placeholder>.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "uso-proibido",
    title: "Usos proibidos",
    body: (
      <>
        <p>Não é permitido usar o Aceito para:</p>
        <ul>
          <li>publicar conteúdo ilegal, ofensivo, discriminatório ou que viole direitos de terceiros;</li>
          <li>enviar mensagens em massa não solicitadas ou se passar por outra pessoa;</li>
          <li>tentar acessar contas ou dados de outros casamentos, burlar limites de segurança ou sobrecarregar a plataforma;</li>
          <li>coletar dados de outros usuários de forma automatizada.</li>
        </ul>
        <p>Podemos suspender ou encerrar contas que descumpram estes termos, preservando o que a lei exigir.</p>
      </>
    ),
  },
  {
    id: "conteudo",
    title: "Conteúdo e propriedade intelectual",
    body: (
      <>
        <p>
          O conteúdo que você publica continua sendo seu. Você nos autoriza a armazená-lo, exibi-lo e adaptá-lo (por exemplo, redimensionar
          fotos) apenas para operar a plataforma. A marca, o design e o software do Aceito são protegidos e não podem ser copiados.
        </p>
      </>
    ),
  },
  {
    id: "responsabilidade",
    title: "Disponibilidade e responsabilidade",
    body: (
      <>
        <p>
          Trabalhamos para manter a plataforma disponível e segura, mas podem ocorrer interrupções para manutenção ou por falhas de
          terceiros (hospedagem, pagamentos, WhatsApp, e-mail). Recomendamos guardar uma cópia dos dados essenciais do casamento (você pode
          baixá-la em <Link href="/conta">Minha conta</Link>).
        </p>
        <p>
          Respondemos pelos danos causados por falha nossa, nos limites da lei e do Código de Defesa do Consumidor. Não respondemos por atos
          de fornecedores, convidados ou outros usuários.
        </p>
      </>
    ),
  },
  {
    id: "privacidade",
    title: "Privacidade",
    body: (
      <p>
        O tratamento de dados pessoais segue a <Link href="/privacidade">Política de privacidade</Link>, que faz parte destes termos.
      </p>
    ),
  },
  {
    id: "alteracoes",
    title: "Alterações dos termos",
    body: (
      <p>
        Podemos atualizar estes termos. Mudanças relevantes serão avisadas por e-mail ou na plataforma com antecedência. Se continuar usando o
        Aceito depois que elas valerem, você concorda com a nova versão; se não concordar, pode excluir a conta.
      </p>
    ),
  },
  {
    id: "lei-foro",
    title: "Lei aplicável e contato",
    body: (
      <>
        <p>
          Estes termos seguem as leis brasileiras. Fica eleito o foro do domicílio do consumidor para resolver eventuais conflitos.
        </p>
        <p>Dúvidas sobre estes termos: {CONTACT_EMAIL}.</p>
      </>
    ),
  },
];

export default function TermosPage() {
  return (
    <LegalPage
      title="Termos de uso"
      updatedAt={<Placeholder>[DATA DA PUBLICAÇÃO]</Placeholder>}
      intro={<p>As regras para usar o Aceito, escritas para serem lidas: o que oferecemos, o que esperamos de cada um e como resolvemos problemas.</p>}
      sections={sections}
      related={{ href: "/privacidade", label: "Política de privacidade" }}
    />
  );
}
