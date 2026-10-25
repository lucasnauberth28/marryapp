// Guia de ajuda da Liz: respostas escritas à mão sobre o que o painel faz hoje. Não é IA nem conversa.
// Cada artigo cita rótulos e rotas reais do painel. Ao mudar um nome de tela, ajuste aqui também.
// Quando a IA for ativada pela administração, este guia pode virar a base de conhecimento inicial.
import { ROTULO_DA_TAXA_DO_PRESENTE } from "../gift-fee.ts";
import type { ModuloComBloqueio } from "../wedding-plan-modules.ts";

export interface ArtigoDeAjuda {
  id: string;
  /** A pergunta, como a pessoa a faria: "Como adiciono convidados?". */
  title: string;
  /** Palavras que a pessoa pode usar e que não estão no título (sinônimos, termos antigos). */
  keywords: string[];
  /** Resposta curta, de uma a três frases. */
  answer: string;
  /** Passos numerados, na ordem em que a pessoa faz. */
  steps: string[];
  /** Para onde o botão "Ir para ..." leva. */
  action: { label: string; href: string };
  /** Caminho do painel exigido (o mesmo de allowedPaths). Quem não tem esse acesso não vê o artigo. */
  path: string;
  /** Recurso que depende do plano: o artigo continua visível, com o aviso do plano. */
  planModule?: ModuloComBloqueio;
  /** Posição em "Dúvidas comuns" (1 é a primeira). Sem número, só aparece na busca. */
  common?: number;
}

export const ARTIGOS_DE_AJUDA: readonly ArtigoDeAjuda[] = [
  {
    id: "adicionar-convidados",
    title: "Como adiciono convidados?",
    keywords: ["cadastrar convidado", "novo convidado", "incluir pessoa", "lista", "acompanhante", "lugares", "grupo", "telefone", "whatsapp"],
    answer:
      "Adicionem um convidado por vez, ou importem uma planilha. Cadastrem o WhatsApp com DDD de cada um: é com esse número que o convidado encontra o convite para confirmar presença.",
    steps: [
      "Abram a Lista de convidados.",
      "Toquem em Adicionar convidado e preencham o nome no convite, o WhatsApp, os lugares e o grupo.",
      "Toquem em Salvar convidado. Ele entra na lista como Sem resposta até responder.",
    ],
    action: { label: "Ir para a Lista de convidados", href: "/convidados" },
    path: "/convidados",
    common: 1,
  },
  {
    id: "importar-convidados",
    title: "Como importo a lista de convidados de uma planilha?",
    keywords: ["importar lista", "planilha", "csv", "excel", "subir lista", "modelo de planilha", "colunas"],
    answer:
      "Em Importar lista, vocês escolhem um arquivo CSV e conferem o que vai entrar antes de adicionar. Planilha do Excel precisa ser salva como CSV primeiro.",
    steps: [
      "Na Lista de convidados, toquem em Importar lista.",
      "Escolham o arquivo CSV. Se ainda não têm planilha, baixem o modelo de planilha.",
      "Confiram a prévia: as colunas são reconhecidas pelo título (Nome, Telefone, E-mail, Acompanhantes, Grupo e Restrição alimentar).",
      "Toquem em Importar para adicionar à lista.",
    ],
    action: { label: "Ir para a Lista de convidados", href: "/convidados" },
    path: "/convidados",
    common: 2,
  },
  {
    id: "acompanhar-confirmacoes",
    title: "Como acompanho quem confirmou presença?",
    keywords: ["rsvp", "respostas", "quem vai", "confirmados", "sem resposta", "nao vao", "prazo de confirmacao", "resumo"],
    answer:
      "Os convidados confirmam pelo link do convite, sem criar conta, e a resposta aparece na lista de vocês. O Início mostra o resumo, e a Lista de convidados separa Confirmados, Sem resposta e Não vão.",
    steps: [
      "Abram a Lista de convidados.",
      "Usem os filtros Confirmados, Sem resposta e Não vão para ver cada grupo.",
      "Em Configurações, vocês podem definir o prazo de confirmação. Ele aparece no alto da lista.",
      "Em Avisos, vocês veem cada resposta nova conforme ela chega.",
    ],
    action: { label: "Ir para a Lista de convidados", href: "/convidados" },
    path: "/convidados",
    common: 3,
  },
  {
    id: "convidado-nao-acha-convite",
    title: "Meu convidado não encontra o convite. O que faço?",
    keywords: ["nao encontra", "nao achou", "convite nao encontrado", "telefone errado", "numero", "confirmar presenca", "link do convite"],
    answer:
      "O convidado digita o WhatsApp com DDD, e o convite aparece se o número for o mesmo que vocês cadastraram. Se não aparecer, o número da lista provavelmente está diferente do dele.",
    steps: [
      "Abram a Lista de convidados e procurem a pessoa pelo nome.",
      "Toquem no convidado e confiram o WhatsApp cadastrado, com DDD.",
      "Corrijam o número, se preciso, e salvem as alterações.",
      "Peçam para o convidado tentar de novo pelo mesmo endereço do site.",
    ],
    action: { label: "Ir para a Lista de convidados", href: "/convidados" },
    path: "/convidados",
  },
  {
    id: "editar-site",
    title: "Como edito o site do casamento?",
    keywords: ["site", "capa", "foto", "historia", "local", "horario", "traje", "playlist", "mural de recados", "dicas", "publicar", "cor"],
    answer:
      "Em Editar o site, cada parte do site tem uma seção: Capa, Nossa história, Cerimônia e recepção, Traje, Dicas aos convidados, Confirmação de presença, Playlist, Presentes em dinheiro e Mural de recados. As mudanças só chegam aos convidados depois de publicar.",
    steps: [
      "Abram Editar o site e escolham uma seção.",
      "Preencham as informações e mostrem ou ocultem a seção no interruptor ao lado do nome dela.",
      "Toquem em Publicar alterações. Até lá, o site dos convidados continua como estava.",
      "Toquem em Ver o site para conferir como os convidados vão ver.",
    ],
    action: { label: "Ir para Editar o site", href: "/site-builder" },
    path: "/site-builder",
    common: 4,
  },
  {
    id: "compartilhar-site",
    title: "Onde acho o endereço do site para compartilhar?",
    keywords: ["link", "endereco do site", "compartilhar", "enviar link", "url", "divulgar", "convite"],
    answer:
      "O endereço do site aparece no alto de Editar o site, ao lado de Ver o site, e também em Configurações. É esse endereço que vocês enviam aos convidados.",
    steps: [
      "Abram Editar o site e publiquem as alterações que ainda não foram publicadas.",
      "Copiem o endereço mostrado no alto da tela.",
      "Enviem o endereço aos convidados pelo meio que preferirem.",
    ],
    action: { label: "Ir para Editar o site", href: "/site-builder" },
    path: "/site-builder",
  },
  {
    id: "criar-presentes",
    title: "Como crio presentes em dinheiro?",
    keywords: ["presente", "lista de presentes", "novo presente", "valor", "cota", "lua de mel", "foto do presente", "recado"],
    answer:
      "Cada presente tem um valor em reais. O convidado escolhe um da lista e paga por Pix ou cartão. Nenhum produto é entregue: o presente é o valor.",
    steps: [
      "Abram Presentes em dinheiro e toquem em Novo presente.",
      "Escolham o nome do presente e o valor em reais. O recado para os convidados e a foto são opcionais.",
      "Toquem para cadastrar. O presente entra na lista de presentes do site.",
      "Toquem em Ver como o convidado vê para conferir.",
    ],
    action: { label: "Ir para Presentes em dinheiro", href: "/presentes-admin" },
    path: "/presentes-admin",
    common: 5,
  },
  {
    id: "receber-presentes",
    title: "Como acompanho os presentes que recebi por Pix e cartão?",
    keywords: ["receber", "pix", "cartao", "pagamento", "a conferir", "confirmar pix", "extrato", "taxa", "recebidos", "dinheiro"],
    answer: `Cada presente pago aparece em Recebidos, com o nome de quem enviou. Alguns pagamentos por Pix ficam A conferir até vocês confirmarem em Finanças. No plano Básico, há taxa de ${ROTULO_DA_TAXA_DO_PRESENTE} por presente recebido.`,
    steps: [
      "Abram Presentes em dinheiro e vejam o Total recebido e a lista Recebidos.",
      "Se houver Pix A conferir, abram Finanças e vejam se o valor entrou no extrato de vocês.",
      "Tocando em Confirmar, o presente fica marcado como pago.",
      "As taxas e as condições de cada plano ficam em Plano e pagamentos.",
    ],
    action: { label: "Ir para Presentes em dinheiro", href: "/presentes-admin" },
    path: "/presentes-admin",
  },
  {
    id: "carteira",
    title: "Para que serve a Carteira?",
    keywords: ["saldo", "cartao de credito", "limite", "quanto temos", "falta pagar", "para gastar", "banco"],
    answer:
      "A Carteira mostra quanto vocês têm para pagar o casamento: o saldo em conta e o limite dos cartões. Só vocês veem. Os presentes recebidos não entram aqui, eles ficam em Presentes em dinheiro e em Finanças.",
    steps: [
      "Abram a Carteira.",
      "Toquem em Atualizar saldo e informem quanto vocês têm em conta.",
      "Toquem em Adicionar cartão para informar banco, final do cartão e limite.",
      "Em Falta pagar, vocês veem o total das despesas em aberto, cadastradas em Finanças.",
    ],
    action: { label: "Ir para a Carteira", href: "/carteira" },
    path: "/carteira",
  },
  {
    id: "enviar-convites-whatsapp",
    title: "Como envio convites e lembretes pelo WhatsApp?",
    keywords: ["whatsapp", "mensagem", "modelo", "convite inicial", "lembrete de confirmacao", "enviar convite", "disparo", "texto"],
    answer:
      "Em Mensagens, vocês escrevem mensagens e enviam convites e lembretes pelo WhatsApp do painel. O envio só acontece quando vocês tocam no botão de enviar: o Aceito não manda nada sozinho.",
    steps: [
      "Abram Mensagens. Os envios rápidos mandam o convite e o lembrete com um toque; as mensagens de convite e de lembrete já vêm prontas.",
      "Para mudar o texto, toquem em Editar na mensagem. O {nome} vira o nome de cada convidado, e a prévia mostra como chega.",
      "Para enviar a quem quiserem, toquem em Enviar na mensagem e escolham quem recebe. Só entra quem tem telefone cadastrado.",
      "Em Configurações, Conexão do WhatsApp mostra se o envio está disponível.",
    ],
    action: { label: "Ir para Mensagens", href: "/mensagens" },
    path: "/mensagens",
    planModule: "whatsapp",
    common: 6,
  },
  {
    id: "lembrar-sem-resposta",
    title: "Como lembro quem ainda não respondeu?",
    keywords: ["lembrete", "cobrar resposta", "sem resposta", "nao respondeu", "pendente", "whatsapp"],
    answer:
      "Na Lista de convidados, o filtro Sem resposta mostra quem ainda não respondeu. De lá, vocês vão para Mensagens e enviam o lembrete a quem tem telefone cadastrado.",
    steps: [
      "Abram a Lista de convidados e escolham o filtro Sem resposta.",
      "Toquem em Abrir mensagens para os sem resposta.",
      "Em Mensagens, toquem em Enviar lembrete nos envios rápidos, ou em Enviar na mensagem de lembrete para escolher quem recebe.",
    ],
    action: { label: "Ir para Mensagens", href: "/mensagens" },
    path: "/mensagens",
    planModule: "whatsapp",
  },
  {
    id: "mesas",
    title: "Como organizo os convidados nas mesas?",
    keywords: ["mesa", "lugares", "nova mesa", "sentar", "distribuir", "arrastar", "sem mesa"],
    answer:
      "Em Mesas, vocês criam as mesas com nome e número de lugares e colocam nelas os convidados que confirmaram presença. Quem ainda não tem mesa fica na lista Sem mesa.",
    steps: [
      "Abram Mesas e toquem em Nova mesa. Escolham o nome e quantos lugares ela tem.",
      "Na lista Sem mesa estão os convidados confirmados que ainda não têm lugar.",
      "Arrastem o convidado pela alça até uma mesa, ou toquem no ícone de troca e escolham a mesa.",
    ],
    action: { label: "Ir para Mesas", href: "/mesas" },
    path: "/mesas",
  },
  {
    id: "mesas-3d",
    title: "Como uso as mesas em 3D e compartilho com os convidados?",
    keywords: ["3d", "tres d", "cenario", "mapa das mesas", "link", "compartilhar mesas", "visualizar", "salao", "jardim", "rustico"],
    answer:
      "Nas mesas em 3D, vocês escolhem o cenário do casamento e sentam os convidados vendo o salão. O link de visualização é só para ver: os convidados acham a própria mesa, e só vocês alteram as mesas.",
    steps: [
      "Em Mesas, toquem em Ver em 3D e escolham o cenário.",
      "Arrastem o convidado até a mesa. No celular, toquem no nome e depois na mesa.",
      "Toquem em Compartilhar para criar o link do mapa. Se ele vazar, gerem um novo: o antigo para de funcionar.",
    ],
    action: { label: "Ir para as mesas em 3D", href: "/mesas/3d" },
    path: "/mesas",
    planModule: "tables3d",
  },
  {
    id: "financas",
    title: "Como controlo as despesas do casamento?",
    keywords: ["despesa", "orcamento", "financas", "parcela", "contrato", "compra", "vencimento", "pagar", "saldo previsto", "gastos"],
    answer:
      "Em Finanças, vocês cadastram contratos com fornecedores e compras avulsas, com as parcelas de cada um. O saldo previsto é o que entrou em presentes menos as despesas.",
    steps: [
      "Abram Finanças e toquem em Nova despesa.",
      "Escolham Contrato com fornecedor ou Compra avulsa ou mimos e informem o valor e o vencimento. Para pagar em parcelas, informem o número de parcelas.",
      "Quando uma parcela for paga, marquem como paga para manter o orçamento certo.",
      "Em Presentes recebidos e Saldo previsto, vocês veem o que entrou e quanto sobra.",
    ],
    action: { label: "Ir para Finanças", href: "/financas" },
    path: "/financas",
  },
  {
    id: "pedir-orcamento",
    title: "Como peço orçamento a um fornecedor?",
    keywords: ["fornecedor", "orcamento", "fotografo", "buffet", "espaco", "decorador", "encontrar fornecedores", "cotacao", "vendor"],
    answer:
      "Em Encontrar fornecedores, vocês procuram profissionais na região do casamento, veem o trabalho de cada um e pedem orçamento. O fornecedor responde pelo WhatsApp que vocês informarem.",
    steps: [
      "Abram Encontrar fornecedores e procurem por categoria e cidade.",
      "Abram o perfil de quem interessa e toquem em Pedir orçamento.",
      "Informem seu nome, o WhatsApp com DDD, a data e a cidade do casamento. O orçamento previsto é opcional.",
      "Aguardem o contato do fornecedor pelo WhatsApp informado.",
    ],
    action: { label: "Ir para Encontrar fornecedores", href: "/fornecedores" },
    path: "/fornecedores",
    common: 7,
  },
  {
    id: "meus-fornecedores",
    title: "Como registro os fornecedores que contratei?",
    keywords: ["contratado", "fornecedor contratado", "contato do fornecedor", "adicionar fornecedor", "equipe"],
    answer:
      "Em Meus fornecedores, vocês guardam quem contrataram para acompanhar o contato e os pagamentos em um só lugar.",
    steps: [
      "Abram Meus fornecedores e toquem em Adicionar fornecedor.",
      "Preencham a categoria, o nome e os dados de contato.",
      "Em Finanças, cadastrem o contrato desse fornecedor para acompanhar as parcelas.",
    ],
    action: { label: "Ir para Meus fornecedores", href: "/meus-fornecedores" },
    path: "/meus-fornecedores",
  },
  {
    id: "convidar-par",
    title: "Como convido meu par para organizar junto?",
    keywords: ["par", "noivo", "noiva", "parceiro", "outra pessoa", "usuario", "acesso", "dividir", "convite do par", "colaborar"],
    answer:
      "Em Minha conta, a seção Convidar seu par cria um convite. Quem entrar por ele organiza o casamento com vocês, com a própria conta e senha.",
    steps: [
      "Toquem no círculo com as iniciais, no alto da tela, e abram Minha conta.",
      "Em Convidar seu par, informem o e-mail do par (opcional) e toquem em Criar convite.",
      "Copiem o link ou toquem em Enviar pelo WhatsApp. O convite vale por 7 dias.",
      "Por segurança, o link aparece só uma vez. Se perderem, criem outro convite.",
    ],
    action: { label: "Ir para Minha conta", href: "/conta#par" },
    path: "/conta",
    common: 8,
  },
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

/** Os artigos de "Dúvidas comuns", na ordem. */
export function artigosComuns(articles: readonly ArtigoDeAjuda[]): ArtigoDeAjuda[] {
  return articles.filter((a) => a.common !== undefined).sort((a, b) => (a.common ?? 0) - (b.common ?? 0));
}
