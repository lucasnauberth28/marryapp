// Desenho das partes do PDF do cronograma (A4 em pé, milímetros): cabeçalho, eventos e rodapé.
import type jsPDF from "jspdf";
import { ASSINATURA_PNG_EM_BASE64, PROPORCAO_DA_ASSINATURA_PNG } from "@/lib/brand/lockup-png";

export interface EventoDaLinhaDoTempoNoPdf {
  id: string;
  title: string;
  time: string;
  description?: string | null;
}

export const MARGEM_X = 20;
const LINHA_X = 35; // Posição X da linha vertical do cronograma
const CONTEUDO_X = 45; // Posição X do conteúdo dos eventos
const ANEL_DO_PONTO = 3.2;

const AMEIXA: [number, number, number] = [94, 43, 78]; // #5E2B4E
const GRAFITE: [number, number, number] = [95, 88, 92];
const TINTA: [number, number, number] = [31, 26, 29];
const LINHA: [number, number, number] = [232, 226, 229];
const AMEIXA_SUAVE: [number, number, number] = [244, 234, 241];

/** Largura e altura da página (210 x 297). */
export function medidasDaPagina(doc: jsPDF) {
  return { largura: doc.internal.pageSize.getWidth(), altura: doc.internal.pageSize.getHeight() };
}

/** Assinatura Aceito, nome do casal, título e data; devolve o Y onde os eventos começam. */
export function desenharCabecalho(doc: jsPDF, coupleNames: string): number {
  const { largura } = medidasDaPagina(doc);
  // Assinatura Aceito no topo (manual p.8: horizontal com no mínimo 35 mm de largura); o resto desce junto.
  const logoWidth = 40;
  doc.addImage(`data:image/png;base64,${ASSINATURA_PNG_EM_BASE64}`, "PNG", (largura - logoWidth) / 2, 12, logoWidth, logoWidth / PROPORCAO_DA_ASSINATURA_PNG);
  let y = 32;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...AMEIXA);
  doc.text(coupleNames.toUpperCase(), largura / 2, y, { align: "center" });

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(...GRAFITE);
  doc.text("Cronograma do Dia do Evento", largura / 2, y, { align: "center" });

  y += 6;
  doc.setFontSize(9);
  const dateStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  doc.text(`Documento gerado em ${dateStr}`, largura / 2, y, { align: "center" });

  y += 6;
  doc.setDrawColor(...LINHA);
  doc.setLineWidth(0.5);
  doc.line(MARGEM_X, y, largura - MARGEM_X, y);
  return y + 12;
}

/** O que o evento ocupa na página: título e descrição quebrados dentro da margem, e a altura do bloco. */
export function medirEvento(doc: jsPDF, event: EventoDaLinhaDoTempoNoPdf) {
  const { largura } = medidasDaPagina(doc);
  // O título começa depois do horário
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  const titleX = CONTEUDO_X + doc.getTextWidth(event.time) + 4;
  doc.setFontSize(12);
  const titleLines: string[] = doc.splitTextToSize(event.title, largura - MARGEM_X - titleX);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  const descLines: string[] = event.description ? doc.splitTextToSize(event.description, largura - MARGEM_X - CONTEUDO_X) : [];

  const altura = 8 + (titleLines.length - 1) * 5.5 + (descLines.length ? 1.5 + descLines.length * 4.5 : 0) + 8;
  return { titleX, titleLines, descLines, altura };
}

/** Página nova, com um cabeçalho simples de continuação; devolve o Y onde o evento começa. */
export function abrirPaginaDeContinuacao(doc: jsPDF, coupleNames: string): number {
  const { largura } = medidasDaPagina(doc);
  doc.addPage();
  const y = 25;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...AMEIXA);
  doc.text(`${coupleNames} · Cronograma, continuação`, MARGEM_X, y - 8);
  doc.setDrawColor(...LINHA);
  doc.setLineWidth(0.3);
  doc.line(MARGEM_X, y - 5, largura - MARGEM_X, y - 5);
  return y;
}

/** A linha vertical liga um ponto ao próximo, por fora dos anéis, para nunca cortar um ponto. */
export function desenharPonto(doc: jsPDF, dotY: number, previousDotY: number | null) {
  if (previousDotY !== null) {
    doc.setDrawColor(...LINHA);
    doc.setLineWidth(0.8);
    doc.line(LINHA_X, previousDotY + ANEL_DO_PONTO, LINHA_X, dotY - ANEL_DO_PONTO);
  }
  doc.setFillColor(...AMEIXA);
  doc.circle(LINHA_X, dotY, 2.5, "F");
  doc.setDrawColor(...AMEIXA_SUAVE);
  doc.setLineWidth(0.6);
  doc.circle(LINHA_X, dotY, ANEL_DO_PONTO, "S");
}

/** Horário, título e descrição do evento a partir de `y`; devolve o Y logo abaixo (com o espaço entre eventos). */
export function desenharTextoDoEvento(doc: jsPDF, event: EventoDaLinhaDoTempoNoPdf, medidas: ReturnType<typeof medirEvento>, y: number): number {
  doc.setFont("helvetica", "bold"); // algarismos do Helvetica já são tabulares
  doc.setFontSize(11);
  doc.setTextColor(...AMEIXA);
  doc.text(event.time, CONTEUDO_X, y + 4);

  doc.setFontSize(12);
  doc.setTextColor(...TINTA);
  medidas.titleLines.forEach((line, i) => doc.text(line, medidas.titleX, y + 4 + i * 5.5));

  let atual = y + 8 + (medidas.titleLines.length - 1) * 5.5;
  if (medidas.descLines.length > 0) {
    atual += 1.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...GRAFITE);
    medidas.descLines.forEach((line) => {
      doc.text(line, CONTEUDO_X, atual);
      atual += 4.5;
    });
  }
  return atual + 6;
}

/** Rodapé em todas as páginas: nome do casal, "Página X de Y" e o endereço do Aceito. */
export function desenharRodapes(doc: jsPDF, coupleNames: string) {
  const { largura, altura } = medidasDaPagina(doc);
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRAFITE);
    doc.setDrawColor(...LINHA);
    doc.setLineWidth(0.3);
    doc.line(MARGEM_X, altura - 15, largura - MARGEM_X, altura - 15);
    doc.text(`${coupleNames} • Cronograma do dia`, MARGEM_X, altura - 10);
    doc.text(`Página ${i} de ${totalPages}`, largura - MARGEM_X, altura - 10, { align: "right" });
    doc.text("Aceito · meuaceito.com.br", MARGEM_X, altura - 6);
  }
}
