// O mural de recados: lista, formulário (aberto ou não) e o envio de um novo recado.
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { criarRecadoNoLivro } from "@/actions/site/recados";
import { PREVIA_DO_LIVRO_DE_RECADOS, type RecadoDoLivro } from "./tipos";

export function useRecados(slug: string, recadosIniciais: RecadoDoLivro[], preview: boolean) {
  const [recados, setRecados] = useState(recadosIniciais);
  const [nome, setNome] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, iniciarEnvio] = useTransition();
  const [mostrarTodos, setMostrarTodos] = useState(false);
  // Sem recados, o formulário já aparece aberto: é o convite para escrever o primeiro.
  const [formularioAberto, setFormularioAberto] = useState(recadosIniciais.length === 0);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (preview) return;
    if (!nome.trim() || !mensagem.trim()) {
      toast.error("Preencha seu nome e a mensagem.");
      return;
    }
    iniciarEnvio(async () => {
      const resposta = await criarRecadoNoLivro(slug, { authorName: nome, message: mensagem });
      if (!resposta.success || !resposta.entry) {
        toast.error(resposta.error || "Não foi possível enviar o recado.");
        return;
      }
      setRecados((anteriores) => [resposta.entry as RecadoDoLivro, ...anteriores]);
      setNome("");
      setMensagem("");
      toast.success("Recado enviado. Obrigado pelo carinho!");
    });
  };

  /** O formulário acabou de aparecer: leva o foco para o primeiro campo. */
  const abrirFormulario = () => {
    setFormularioAberto(true);
    requestAnimationFrame(() => document.getElementById("guestbook-name")?.focus());
  };

  const visiveis = mostrarTodos ? recados : recados.slice(0, PREVIA_DO_LIVRO_DE_RECADOS);
  return { recados, visiveis, nome, setNome, mensagem, setMensagem, enviando, enviar, mostrarTodos, alternarMostrarTodos: () => setMostrarTodos((v) => !v), formularioAberto, abrirFormulario };
}

export type MuralDeRecados = ReturnType<typeof useRecados>;
