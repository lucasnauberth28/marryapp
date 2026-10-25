import Link from "next/link";
import type { SecaoLegal } from "@/components/legal/legal-page";
import { CONTROLADOR } from "./comuns";

export const secoesDoContrato: SecaoLegal[] = [
  {
    id: "aceitacao",
    title: "Sobre estes termos",
    body: (
      <>
        <p>
          Estes termos regulam o uso do Aceito, plataforma oferecida por {CONTROLADOR} (&quot;Aceito&quot;). Ao criar uma conta ou usar a
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
];
