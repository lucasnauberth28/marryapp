// Cálculo das parcelas que a pessoa configurou no cadastro (blocos de N parcelas com valor e primeiro vencimento).
import { FORMAS_DE_PAGAMENTO, type BlocoDeParcelas, type CartaoDaCarteira, type FormaDePagamento, type ParcelaGerada, type TipoDeDespesa } from "./tipos.ts";
import { CreditCard, FileCheck, QrCode } from "lucide-react";

export interface DadosParaGerarParcelas {
  modo: "single" | "installment";
  descricao: string;
  tipo: TipoDeDespesa;
  fornecedorId: string;
  loja: string;
  link: string;
  formaDePagamento: string;
  formaPersonalizada: string;
  imagem: string;
  blocos: BlocoDeParcelas[];
}

/** O texto que vai para o servidor: o rótulo da forma escolhida, ou o texto livre quando é "custom". */
export function rotuloDaForma(formaDePagamento: string, formaPersonalizada: string) {
  if (formaDePagamento === "custom") return formaPersonalizada;
  return FORMAS_DE_PAGAMENTO.find((p) => p.id === formaDePagamento)?.label || formaDePagamento;
}

function parcelasDoBloco(bloco: BlocoDeParcelas, d: DadosParaGerarParcelas, total: number, primeiroNumero: number): ParcelaGerada[] {
  const quantidade = Number(bloco.count) || 0;
  const centavos = Math.round(parseFloat((bloco.amount || "0").replace(",", ".")) * 100);
  const base = bloco.startDate ? new Date(bloco.startDate) : new Date();
  const forma = rotuloDaForma(d.formaDePagamento, d.formaPersonalizada);
  return Array.from({ length: quantidade }, (_, i) => {
    const vencimento = new Date(base);
    vencimento.setMonth(vencimento.getMonth() + i);
    return {
      description: `${d.descricao || "Despesa"} (${primeiroNumero + i}/${total})`,
      amount: isNaN(centavos) ? 0 : centavos,
      dueDate: vencimento.toISOString().split("T")[0],
      type: d.tipo,
      vendorId: d.tipo === "CONTRACT" ? d.fornecedorId : null,
      purchaseUrl: d.tipo === "PURCHASE" ? d.link : null,
      paymentMethod: forma,
      imageUrl: d.imagem || null,
      storeName: d.tipo === "PURCHASE" ? d.loja : null,
    };
  });
}

export function gerarParcelas(d: DadosParaGerarParcelas): ParcelaGerada[] {
  if (d.modo !== "installment") return [];
  const total = d.blocos.reduce((soma, b) => soma + (Number(b.count) || 0), 0);
  if (total === 0) return [];
  const parcelas: ParcelaGerada[] = [];
  for (const bloco of d.blocos) parcelas.push(...parcelasDoBloco(bloco, d, total, parcelas.length + 1));
  return parcelas;
}

/** Formas de pagamento oferecidas: Pix, os cartões da carteira (ou dois cartões comuns) e boleto. */
export function formasDePagamentoOferecidas(cartoes: CartaoDaCarteira[]): FormaDePagamento[] {
  const lista: FormaDePagamento[] = [{ id: "pix_balance", label: "Saldo em Conta / Pix", icon: QrCode }];
  if (cartoes.length > 0) {
    for (const c of cartoes) {
      lista.push({ id: `card_${c.id}`, label: `${c.bank}${c.nickname ? ` (${c.nickname})` : ""}${c.lastDigits ? ` ****${c.lastDigits}` : ""}`, icon: CreditCard });
    }
  } else {
    lista.push({ id: "credit_card_nubank", label: "Cartão Nubank", icon: CreditCard }, { id: "credit_card_itau", label: "Cartão Itaú", icon: CreditCard });
  }
  lista.push({ id: "boleto", label: "Boleto Bancário", icon: FileCheck });
  return lista;
}
