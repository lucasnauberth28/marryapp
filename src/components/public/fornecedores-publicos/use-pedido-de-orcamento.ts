// O pedido de orçamento (ou reunião) feito ao fornecedor, dentro de uma janela.
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { criarPedidoDeOrcamento } from "@/actions/vitrine/pedido";
import { somenteDigitos } from "@/lib/formatacao/telefone";
import type { FornecedorPublico } from "./constantes";

export type TipoDeReuniao = "ONLINE" | "PRESENTIAL";

/** O pedido enviado: a confirmação fica na janela (um aviso passageiro some antes de ser lido). */
export interface PedidoEnviado {
  vendor: string;
  first: string;
  whatsapp: string | null;
  text: string;
}

const CAMPOS_VAZIOS = { nome: "", telefone: "", email: "", convidados: "", dataDoCasamento: "", recado: "" };

export type CampoDoPedido = keyof typeof CAMPOS_VAZIOS;

export function usePedidoDeOrcamento() {
  const [aberto, setAberto] = useState(false);
  const [fornecedor, setFornecedor] = useState<FornecedorPublico | null>(null);
  const [campos, setCampos] = useState(CAMPOS_VAZIOS);
  const [reuniao, setReuniao] = useState<TipoDeReuniao>("ONLINE");
  const [enviado, setEnviado] = useState<PedidoEnviado | null>(null);
  const [enviando, iniciarEnvio] = useTransition();

  const definir = (campo: CampoDoPedido) => (valor: string) => setCampos((c) => ({ ...c, [campo]: valor }));

  const abrirPara = (alvo: FornecedorPublico) => {
    setFornecedor(alvo);
    setEnviado(null);
    setAberto(true);
  };

  const registrarEnvio = (alvo: FornecedorPublico) => {
    // WhatsApp direto é recurso do Pro/Master (o servidor nem envia o número dos demais).
    const whatsapp = alvo.planTier !== "FREE" ? somenteDigitos(alvo.whatsapp) || null : null;
    const data = campos.dataDoCasamento ? ` para o casamento em ${new Date(campos.dataDoCasamento).toLocaleDateString("pt-BR")}` : "";
    setEnviado({ vendor: alvo.companyName, first: campos.nome.split(" ")[0], whatsapp, text: `Olá! Sou ${campos.nome} e acabei de pedir um orçamento pelo Aceito${data}.` });
    // Depois do envio, limpa os dados da pessoa, mas guarda a data do casamento.
    setCampos((c) => ({ ...CAMPOS_VAZIOS, dataDoCasamento: c.dataDoCasamento }));
  };

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fornecedor || !campos.nome || !campos.telefone) {
      toast.error("Preencha seu nome e WhatsApp para o fornecedor poder responder.");
      return;
    }
    iniciarEnvio(async () => {
      const resposta = await criarPedidoDeOrcamento({
        vendorId: fornecedor.id, coupleName: campos.nome, couplePhone: campos.telefone, coupleEmail: campos.email,
        guestCount: campos.convidados ? parseInt(campos.convidados, 10) : undefined,
        weddingDate: campos.dataDoCasamento ? new Date(campos.dataDoCasamento) : undefined, message: campos.recado, meetingType: reuniao,
      });
      if (resposta.success) registrarEnvio(fornecedor);
      else toast.error(resposta.error || "Não conseguimos enviar o pedido. Tente de novo.");
    });
  };

  return { aberto, setAberto, fornecedor, abrirPara, campos, definir, reuniao, setReuniao, enviado, enviando, enviar };
}

export type PedidoDeOrcamento = ReturnType<typeof usePedidoDeOrcamento>;
