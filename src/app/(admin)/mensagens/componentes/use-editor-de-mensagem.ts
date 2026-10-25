// O estado do editor de uma mensagem: campos, links, salvar, excluir e inserir o {nome} no texto.
import { useState, type RefObject } from "react";
import { toast } from "sonner";
import { atualizarModeloDeMensagem, criarModeloDeMensagem, excluirModeloDeMensagem } from "@/actions/mensagens/modelos";
import { LINKS_PADRAO, MAXIMO_DE_LINKS, type ItemDeLink, type ModeloDeMensagem } from "./tipos";
import { interpretarLinks } from "./utilitarios";

interface EntradaDoEditor {
  modelo: ModeloDeMensagem | null;
  campoDoTexto: RefObject<HTMLTextAreaElement | null>;
  aoSalvar: (m: ModeloDeMensagem, criado: boolean) => void;
  aoExcluir: (id: string) => void;
}

function formularioDaMensagem(c: { nome: string; conteudo: string; midiaUrl: string; tipoDaMidia: string; tipo: string; links: ItemDeLink[] }) {
  const formulario = new FormData();
  formulario.append("name", c.nome);
  formulario.append("content", c.conteudo);
  formulario.append("mediaUrl", c.midiaUrl);
  formulario.append("mediaType", c.tipoDaMidia);
  formulario.append("type", c.tipo);
  formulario.append("buttons", JSON.stringify(c.links.filter((l) => l.text.trim())));
  return formulario;
}

/** Põe a variável onde está o cursor (ou no fim do texto). */
function inserirNoCursor(campo: HTMLTextAreaElement | null, conteudo: string, definir: (texto: string | ((c: string) => string)) => void, variavel: string) {
  if (!campo) return definir((c) => `${c}${variavel}`);
  const inicio = campo.selectionStart ?? conteudo.length, fim = campo.selectionEnd ?? conteudo.length;
  definir(conteudo.slice(0, inicio) + variavel + conteudo.slice(fim));
  requestAnimationFrame(() => {
    campo.focus();
    campo.setSelectionRange(inicio + variavel.length, inicio + variavel.length);
  });
}

export function useEditorDeMensagem({ modelo, campoDoTexto, aoSalvar, aoExcluir }: EntradaDoEditor) {
  const [nome, setNome] = useState(modelo?.name ?? "");
  const [conteudo, setConteudo] = useState(modelo?.content ?? "");
  const [tipo, setTipo] = useState(modelo?.type ?? "CUSTOM");
  const [midiaUrl, setMidiaUrl] = useState(modelo?.mediaUrl ?? "");
  const [tipoDaMidia, setTipoDaMidia] = useState(modelo?.mediaType ?? "image");
  const [links, setLinks] = useState<ItemDeLink[]>(modelo ? interpretarLinks(modelo.buttons) : LINKS_PADRAO);
  const [salvando, setSalvando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  const inserirNome = () => inserirNoCursor(campoDoTexto.current, conteudo, setConteudo, "{nome}");

  const adicionarLink = () => {
    if (links.length >= MAXIMO_DE_LINKS) return void toast.error("São no máximo 3 links por mensagem.");
    setLinks([...links, { id: `badge_${Date.now()}`, text: "" }]);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    const idDoAviso = toast.loading("Salvando a mensagem...");
    const formulario = formularioDaMensagem({ nome, conteudo, midiaUrl, tipoDaMidia, tipo, links });
    const resposta = modelo ? await atualizarModeloDeMensagem(modelo.id, formulario) : await criarModeloDeMensagem(formulario);
    if (resposta.success && resposta.data) {
      toast.success("Mensagem salva.", { id: idDoAviso });
      aoSalvar(resposta.data as ModeloDeMensagem, !modelo);
    } else toast.error(resposta.error || "Não deu para salvar a mensagem. Tente de novo.", { id: idDoAviso });
    setSalvando(false);
  };

  const excluir = async () => {
    if (!modelo) return;
    const idDoAviso = toast.loading("Excluindo a mensagem...");
    const resposta = await excluirModeloDeMensagem(modelo.id);
    if (resposta.success) {
      toast.success("Mensagem excluída.", { id: idDoAviso });
      aoExcluir(modelo.id);
    } else toast.error(resposta.error || "Não deu para excluir agora. Tente de novo.", { id: idDoAviso });
  };

  return { nome, setNome, conteudo, setConteudo, tipo, setTipo, midiaUrl, setMidiaUrl, tipoDaMidia, setTipoDaMidia, links, setLinks, salvando, confirmandoExclusao, setConfirmandoExclusao, inserirNome, adicionarLink, salvar, excluir };
}

export type EditorDeMensagem = ReturnType<typeof useEditorDeMensagem>;
