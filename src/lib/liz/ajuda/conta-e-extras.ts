// Guia de ajuda da Liz: endereço próprio, planos, entrada, tarefas, cronograma, avisos e a conta.
import { ROTULO_DA_TAXA_DO_PRESENTE } from "../../gift-fee.ts";
import type { ArtigoDeAjuda } from "../help-articles.ts";

export const ARTIGOS_DA_CONTA_E_EXTRAS: readonly ArtigoDeAjuda[] = [
  {
    id: "endereco-personalizado",
    title: "Como peço um endereço personalizado para o site?",
    keywords: ["dominio", "dominio proprio", "com.br", "endereco proprio", "nome do site", "anaerafael", "registrar"],
    answer:
      "O endereço personalizado é um endereço só de vocês, como anaerafael.com.br, registrado no nome do titular. O primeiro ano está incluído, e as renovações ficam por conta do titular. Ele é do plano VIP.",
    steps: [
      "Abram Endereço personalizado e escolham o nome do endereço.",
      "Informem os dados do titular: nome completo ou razão social, CPF ou CNPJ, telefone e e-mail.",
      "Leiam as condições, aceitem e toquem em Pedir este endereço.",
      "Acompanhem o pedido na mesma tela, até o dia em que o endereço entra no ar.",
    ],
    action: { label: "Ir para Endereço personalizado", href: "/dominio" },
    path: "/dominio",
    planModule: "customDomain",
  },
  {
    id: "planos",
    title: "Quais são os planos e o que muda em cada um?",
    keywords: ["plano", "basico", "classic", "vip", "preco", "taxa", "pagamento unico", "mensalidade", "assinar", "upgrade", "melhorar plano"],
    answer: `O plano Básico não tem mensalidade e cobra ${ROTULO_DA_TAXA_DO_PRESENTE} por presente recebido. Classic e VIP têm pagamento único, e cada um libera recursos a mais, como o WhatsApp pelo painel, o registro de entrada com código QR e o endereço personalizado.`,
    steps: [
      "Abram Plano e pagamentos.",
      "Comparem os recursos e as taxas de cada plano.",
      "Escolham o plano e sigam o pagamento. O plano vale para o casamento inteiro.",
    ],
    action: { label: "Ir para Plano e pagamentos", href: "/plano" },
    path: "/plano",
    common: 9,
  },
  {
    id: "registro-entrada",
    title: "Como registro a entrada dos convidados com código QR?",
    keywords: ["qr", "qr code", "check-in", "checkin", "credenciamento", "entrada", "portaria", "festa", "camera", "chegada"],
    answer:
      "Quem confirma presença pelo link recebe um código QR para a entrada na festa. No dia, vocês apontam a câmera para o código e registram a chegada de cada convidado.",
    steps: [
      "Abram o Registro de entrada dos convidados no aparelho que fica na porta.",
      "Toquem em Ler código QR do convidado e permitam o uso da câmera.",
      "Apontem a câmera para o código do convidado e confiram nome, pessoas e mesa.",
      "Toquem em Registrar entrada. O alto da tela conta quantos confirmados já chegaram.",
    ],
    action: { label: "Ir para o Registro de entrada", href: "/credenciamento" },
    path: "/credenciamento",
    planModule: "qrcode",
  },
  {
    id: "tarefas",
    title: "Como organizo as tarefas do casamento?",
    keywords: ["pendencias", "lista de tarefas", "to-do", "prazo", "atrasada", "concluida", "afazeres"],
    answer:
      "Em Tarefas, vocês anotam o que falta fazer, com prazo, e acompanham o que está aberto, atrasado ou concluído.",
    steps: [
      "Abram Tarefas e toquem em Nova tarefa. Informem o título e, se quiserem, o prazo.",
      "Marquem a caixa ao lado da tarefa quando ela estiver feita.",
      "Usem os filtros Abertas, Atrasadas e Concluídas para ver cada grupo.",
    ],
    action: { label: "Ir para Tarefas", href: "/pendencias" },
    path: "/pendencias",
  },
  {
    id: "cronograma",
    title: "Como monto o cronograma do dia?",
    keywords: ["horarios", "programacao", "dia do evento", "roteiro", "agenda do dia", "cerimonia"],
    answer:
      "Em Cronograma do dia, vocês listam os horários do casamento. Os convidados veem esses horários na página do dia do evento, no site de vocês.",
    steps: [
      "Abram Cronograma do dia.",
      "Toquem em Novo horário e adicionem cada momento com horário e descrição.",
      "Confiram a ordem. Os convidados veem a lista no site.",
    ],
    action: { label: "Ir para Cronograma do dia", href: "/cronograma" },
    path: "/cronograma",
  },
  {
    id: "avisos",
    title: "Como funcionam os avisos e notificações?",
    keywords: ["notificacao", "sino", "alerta", "push", "email", "lembretes", "preferencias de aviso"],
    answer:
      "O sino, no alto da tela, mostra os avisos do casamento: presentes recebidos, respostas dos convidados e lembretes. Em Minha conta, vocês escolhem como querem ser avisados.",
    steps: [
      "Toquem no sino para ver os últimos avisos, ou abram Avisos para ver o histórico.",
      "Em Minha conta, na seção Avisos, escolham quais avisos querem receber.",
      "Também é possível ativar os avisos no aparelho, na mesma seção.",
    ],
    action: { label: "Ir para Avisos", href: "/notificacoes" },
    path: "/notificacoes",
  },
  {
    id: "conta",
    title: "Como troco a minha senha ou os meus dados?",
    keywords: ["senha", "minha conta", "perfil", "dados", "email", "excluir conta", "sair", "trocar senha"],
    answer:
      "Em Minha conta, vocês trocam a senha, veem os seus dados, convidam o par e, se quiserem, excluem a conta.",
    steps: [
      "Toquem no círculo com as iniciais, no alto da tela, e abram Minha conta.",
      "Na seção Senha, informem a senha atual e a nova, com pelo menos 8 caracteres.",
      "Na seção Seus dados, confiram o que o Aceito guarda sobre a conta.",
    ],
    action: { label: "Ir para Minha conta", href: "/conta" },
    path: "/conta",
  },
  {
    id: "sobre-liz",
    title: "O que a Liz faz?",
    keywords: ["liz", "assistente", "madrinha", "sugestao", "inteligencia artificial", "ia", "chat", "robo"],
    answer:
      "A Liz é uma conversa com assuntos prontos: sugere o próximo passo com base no que está no painel de vocês e responde dúvidas pelo guia de ajuda. Ela não conversa livremente e nunca faz nada por vocês: vocês escolhem o que fazer.",
    steps: [
      "Toquem no botão da Liz, fixo no canto da tela, para abrir a conversa.",
      "Escolham um assunto, ou O que fazer agora?, para ver o que merece atenção, com os números reais do casamento.",
      "Dentro do assunto, toquem na dúvida para abrir a resposta com os passos e ir direto à tela certa. Também dá para escrever a dúvida.",
    ],
    action: { label: "Ir para o Início", href: "/dashboard" },
    path: "/dashboard",
  },
];
