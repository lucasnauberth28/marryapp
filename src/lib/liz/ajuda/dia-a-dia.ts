// Guia de ajuda da Liz: presentes recebidos, mensagens, mesas, finanças, fornecedores e o par.
import { ROTULO_DA_TAXA_DO_PRESENTE } from "../../gift-fee.ts";
import type { ArtigoDeAjuda } from "../help-articles.ts";

export const ARTIGOS_DO_DIA_A_DIA: readonly ArtigoDeAjuda[] = [
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
];
