import Link from "next/link";
import type { SecaoLegal } from "@/components/legal/legal-page";
import { CONTROLADOR, EMAIL_DO_ENCARREGADO } from "./comuns";

export const secoesDeDireitos: SecaoLegal[] = [
  {
    id: "retencao",
    title: "Por quanto tempo guardamos",
    body: (
      <>
        <ul>
          <li>Dados da conta e do casamento: enquanto a conta existir. Ao excluir a conta, apagamos os dados em até 30 dias, salvo as exceções abaixo.</li>
          <li>Registros de acesso à aplicação: 6 meses, como exige o Marco Civil da Internet (Lei 12.965/2014, art. 15).</li>
          <li>Dados de pagamentos e notas fiscais: pelo prazo exigido pela legislação fiscal e tributária (em geral, 5 anos).</li>
          <li>Dados de recebimento dos presentes: até o casal removê-los em Configurações ou excluir a conta; depois disso são apagados, salvo o que a legislação fiscal exigir sobre repasses já feitos.</li>
          <li>Cópias de segurança (backups) são sobrescritas periodicamente e podem manter dados por um período limitado, definido pelo provedor de hospedagem do banco de dados, e depois são descartadas.</li>
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
          {EMAIL_DO_ENCARREGADO}. Respondemos em até 15 dias. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
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
          Dúvidas, pedidos ou reclamações sobre privacidade: escreva para o encarregado pelo e-mail {EMAIL_DO_ENCARREGADO}. Controlador: {CONTROLADOR}.
        </p>
      </>
    ),
  },
];
