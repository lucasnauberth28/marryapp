// Guia de ajuda da Liz: convidados, site e criação de presentes.
import type { ArtigoDeAjuda } from "../help-articles.ts";

export const ARTIGOS_DOS_PRIMEIROS_PASSOS: readonly ArtigoDeAjuda[] = [
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
];
