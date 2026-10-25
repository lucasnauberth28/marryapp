// O cadastro de despesa em três passos: junta os dados, a condição de pagamento e o envio ao servidor.
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { criarDespesa, criarDespesasEmLote } from "@/actions/expense-actions";
import { gerarParcelas, rotuloDaForma } from "./parcelas";
import type { ParcelaGerada } from "./tipos";
import { useCondicaoDePagamento, type CondicaoDePagamento } from "./use-condicao-de-pagamento";
import { useDadosDaDespesa, type DadosDaDespesa } from "./use-dados-da-despesa";

const ERRO_DURADOURO = { duration: 6000 };

function formularioDoPagamentoUnico(d: DadosDaDespesa, p: CondicaoDePagamento) {
  const forma = rotuloDaForma(d.formaDePagamento, d.formaPersonalizada);
  const formulario = new FormData();
  formulario.append("description", d.descricao);
  formulario.append("amount", Math.round(parseFloat(p.valorUnico.replace(",", ".")) * 100).toString());
  formulario.append("dueDate", p.vencimentoUnico);
  formulario.append("type", d.tipo);
  if (d.tipo === "CONTRACT" && d.fornecedorId) formulario.append("vendorId", d.fornecedorId);
  if (d.tipo === "PURCHASE") {
    if (d.loja) formulario.append("storeName", d.loja);
    if (d.link) formulario.append("purchaseUrl", d.link);
  }
  if (forma) formulario.append("paymentMethod", forma);
  if (d.imagem) formulario.append("imageUrl", d.imagem);
  return formulario;
}

async function salvarPagamentoUnico(d: DadosDaDespesa, p: CondicaoDePagamento, idDoAviso: string | number) {
  const resposta = await criarDespesa(formularioDoPagamentoUnico(d, p));
  if (resposta.success) toast.success("Despesa cadastrada.", { id: idDoAviso });
  else toast.error(resposta.error || "Não deu para cadastrar a despesa. Tente de novo.", { id: idDoAviso, ...ERRO_DURADOURO });
  return resposta.success;
}

/** Confere o que falta antes de mandar as parcelas; devolve o aviso ou null. */
function problemaNoParcelamento(d: DadosDaDespesa, parcelas: ParcelaGerada[]) {
  if (d.tipo === "CONTRACT" && !d.fornecedorId) return "Selecione um fornecedor para contratos.";
  if (!d.descricao) return "Informe a descrição principal da despesa.";
  if (parcelas.length === 0) return "Configure ao menos uma parcela válida.";
  return null;
}

async function salvarParcelado(d: DadosDaDespesa, parcelas: ParcelaGerada[], idDoAviso: string | number) {
  const problema = problemaNoParcelamento(d, parcelas);
  if (problema) {
    toast.error(problema, { id: idDoAviso });
    return false;
  }
  const resposta = await criarDespesasEmLote(parcelas);
  if (resposta.success) toast.success(`${parcelas.length} parcelas registradas.`, { id: idDoAviso });
  else toast.error(resposta.error || "Não deu para cadastrar as parcelas. Tente de novo.", { id: idDoAviso, ...ERRO_DURADOURO });
  return resposta.success;
}

export function useCadastroDeDespesa() {
  const router = useRouter();
  const dados = useDadosDaDespesa(), pagamento = useCondicaoDePagamento();
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [passo, setPasso] = useState<1 | 2 | 3>(1);
  const [chaveDoFormulario, setChaveDoFormulario] = useState(0);

  const parcelas = useMemo(
    () => gerarParcelas({ modo: pagamento.modo, descricao: dados.descricao, tipo: dados.tipo, fornecedorId: dados.fornecedorId, loja: dados.loja, link: dados.link, formaDePagamento: dados.formaDePagamento, formaPersonalizada: dados.formaPersonalizada, imagem: dados.imagem, blocos: pagamento.blocos }),
    [pagamento.modo, pagamento.blocos, dados.descricao, dados.tipo, dados.fornecedorId, dados.loja, dados.link, dados.formaDePagamento, dados.formaPersonalizada, dados.imagem],
  );
  const totalDasParcelas = useMemo(() => parcelas.reduce((soma, p) => soma + p.amount, 0), [parcelas]);

  const reiniciar = () => {
    setPasso(1);
    dados.reiniciar();
    pagamento.reiniciar();
    setChaveDoFormulario((k) => k + 1);
  };

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCarregando(true);
    const idDoAviso = toast.loading("Salvando a despesa...");
    const deuCerto = pagamento.modo === "single" ? await salvarPagamentoUnico(dados, pagamento, idDoAviso) : await salvarParcelado(dados, parcelas, idDoAviso);
    if (deuCerto) {
      reiniciar();
      setAberto(false);
      router.refresh();
    }
    setCarregando(false);
  };

  const aoMudarAberto = (abrir: boolean) => {
    setAberto(abrir);
    if (!abrir) reiniciar();
  };

  return { aberto, aoMudarAberto, carregando, passo, setPasso, chaveDoFormulario, dados, pagamento, parcelas, totalDasParcelas, enviar };
}

export type CadastroDeDespesa = ReturnType<typeof useCadastroDeDespesa>;
