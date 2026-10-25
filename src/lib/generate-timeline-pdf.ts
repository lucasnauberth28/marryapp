import jsPDF from "jspdf";
import { ASSINATURA_PNG_EM_BASE64, PROPORCAO_DA_ASSINATURA_PNG } from "@/lib/brand/lockup-png";
import { nomeDoArquivoPdfDaLinhaDoTempo } from "@/lib/timeline-pdf-name";

export interface EventoDaLinhaDoTempoNoPdf {
  id: string;
  title: string;
  time: string;
  description?: string | null;
}

export function gerarPdfDaLinhaDoTempo(events: EventoDaLinhaDoTempoNoPdf[], coupleNames = "Nosso Casamento") {
  if (!events || events.length === 0) {
    return false;
  }

  // Ordenar os eventos por horário
  const sortedEvents = [...events].sort((a, b) => a.time.localeCompare(b.time));

  // Instanciar jsPDF (A4 portrait, milímetros)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const pageHeight = doc.internal.pageSize.getHeight(); // 297

  const marginX = 20;
  // Assinatura Aceito no topo (manual p.8: horizontal com no mínimo 35 mm de largura); o resto desce junto.
  const logoWidth = 40;
  doc.addImage(`data:image/png;base64,${ASSINATURA_PNG_EM_BASE64}`, "PNG", (pageWidth - logoWidth) / 2, 12, logoWidth, logoWidth / PROPORCAO_DA_ASSINATURA_PNG);
  let currentY = 32;

  // --- CABEÇALHO ---
  // Título do Casamento
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(94, 43, 78); // #5E2B4E
  doc.text(coupleNames.toUpperCase(), pageWidth / 2, currentY, { align: "center" });

  currentY += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(95, 88, 92); // grafite
  doc.text("Cronograma do Dia do Evento", pageWidth / 2, currentY, { align: "center" });

  currentY += 6;
  doc.setFontSize(9);
  doc.setTextColor(95, 88, 92);
  const dateStr = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.text(`Documento gerado em ${dateStr}`, pageWidth / 2, currentY, { align: "center" });

  currentY += 6;

  // Linha divisória do cabeçalho
  doc.setDrawColor(232, 226, 229); // linha
  doc.setLineWidth(0.5);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);

  currentY += 12;

  // --- VERTICAL TIMELINE DESIGN ---
  const lineX = 35; // Posição X da linha vertical do cronograma
  const contentX = 45; // Posição X do conteúdo dos eventos
  const maxContentWidth = pageWidth - marginX - contentX; // Largura do texto (210 - 20 - 45 = 145mm)

  // Centro do ponto anterior na página atual: a linha liga um ponto ao próximo, por fora dos anéis, para nunca cortar um ponto.
  const dotRing = 3.2;
  let previousDotY: number | null = null;

  sortedEvents.forEach((event) => {
    // Título e descrição quebram dentro da margem; o título começa depois do horário
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const timeWidth = doc.getTextWidth(event.time);
    const titleX = contentX + timeWidth + 4;
    doc.setFontSize(12);
    const titleLines: string[] = doc.splitTextToSize(event.title, pageWidth - marginX - titleX);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const descLines: string[] = event.description ? doc.splitTextToSize(event.description, maxContentWidth) : [];

    const itemHeight = 8 + (titleLines.length - 1) * 5.5 + (descLines.length ? 1.5 + descLines.length * 4.5 : 0) + 8; // altura do bloco

    // Verificar se estouro de página
    if (currentY + itemHeight > pageHeight - 25) {
      doc.addPage();
      currentY = 25;
      previousDotY = null;

      // Redesenhar um cabeçalho simples de continuação
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(94, 43, 78);
      doc.text(`${coupleNames} · Cronograma, continuação`, marginX, currentY - 8);

      doc.setDrawColor(232, 226, 229); // linha
      doc.setLineWidth(0.3);
      doc.line(marginX, currentY - 5, pageWidth - marginX, currentY - 5);
    }

    const eventStartY = currentY;
    const dotY = eventStartY + 3;

    // 1. Linha vertical desde o ponto anterior (só entre os anéis) e depois o ponto
    if (previousDotY !== null) {
      doc.setDrawColor(232, 226, 229);
      doc.setLineWidth(0.8);
      doc.line(lineX, previousDotY + dotRing, lineX, dotY - dotRing);
    }
    doc.setFillColor(94, 43, 78); // #5E2B4E
    doc.circle(lineX, dotY, 2.5, "F");
    doc.setDrawColor(244, 234, 241); // ameixa-suave
    doc.setLineWidth(0.6);
    doc.circle(lineX, dotY, dotRing, "S");
    previousDotY = dotY;

    // 2. Horário
    doc.setFont("helvetica", "bold"); // algarismos do Helvetica já são tabulares
    doc.setFontSize(11);
    doc.setTextColor(94, 43, 78);
    doc.text(event.time, contentX, eventStartY + 4);

    // 3. Título do evento
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(31, 26, 29); // tinta
    titleLines.forEach((line, i) => doc.text(line, titleX, eventStartY + 4 + i * 5.5));

    currentY += 8 + (titleLines.length - 1) * 5.5;

    // 4. Descrição (se houver)
    if (descLines.length > 0) {
      currentY += 1.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(95, 88, 92); // grafite
      descLines.forEach((line: string) => {
        doc.text(line, contentX, currentY);
        currentY += 4.5;
      });
    }

    currentY += 6; // Espaçamento entre eventos
  });

  // --- RODAPÉ EM TODAS AS PÁGINAS ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(95, 88, 92);

    // Linha superior do rodapé
    doc.setDrawColor(232, 226, 229);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 15, pageWidth - marginX, pageHeight - 15);

    // Texto rodapé
    doc.text(
      `${coupleNames} • Cronograma do dia`,
      marginX,
      pageHeight - 10
    );
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - marginX,
      pageHeight - 10,
      { align: "right" }
    );
    doc.text("Aceito · meuaceito.com.br", marginX, pageHeight - 6);
  }

  // Salvar PDF
  doc.save(nomeDoArquivoPdfDaLinhaDoTempo(coupleNames));
  return true;
}
