import Link from "next/link";
import type { SecaoLegal } from "@/components/legal/legal-page";
import { ROTULO_DA_TAXA_DO_PRESENTE } from "@/lib/pagamento/gift-fee";
import { EMAIL_DE_CONTATO } from "./comuns";

export const secoesDeResponsabilidades: SecaoLegal[] = [
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
            Presentes em dinheiro pagos por convidados passam pelo Aceito (o pagamento é processado pelo Mercado Pago). Quando o plano do
            casal prevê, o Aceito retém {ROTULO_DA_TAXA_DO_PRESENTE} de cada presente, conforme informado na página de planos.
          </li>
          <li>
            O valor que sobra é repassado ao destino que o casal cadastrar em Configurações (chave Pix ou conta bancária em nome de uma
            pessoa ou empresa do casal). O repasse é liberado pela equipe do Aceito; o prazo e a forma serão informados antes de o recurso
            ser ativado, e o Aceito não promete repasse automático ou em prazo fixo enquanto isso não for informado.
          </li>
          <li>
            Os dados de recebimento ficam guardados criptografados e são usados só para fazer o repasse. Trocar ou remover esses dados exige
            a senha do casal, e as pessoas do casamento são avisadas a cada mudança. O casal é responsável por informar dados corretos e de
            sua titularidade.
          </li>
          <li>
            Nas contratações pela internet, você pode desistir em até 7 dias da contratação, com reembolso integral, conforme o art. 49 do
            Código de Defesa do Consumidor. Pedidos de reembolso: <a href="mailto:contato@meuaceito.com.br">contato@meuaceito.com.br</a>.
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
        <p>Dúvidas sobre estes termos: {EMAIL_DE_CONTATO}.</p>
      </>
    ),
  },
];
