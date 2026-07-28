import jsPDF from "jspdf";

export interface TimelineEventPdf {
  id: string;
  title: string;
  time: string;
  description?: string | null;
}

export function generateTimelinePdf(events: TimelineEventPdf[], coupleNames = "Lucas & Giovanna") {
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
  let currentY = 20;

  // --- CABEÇALHO ---
  // Título do Casamento
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(140, 109, 69); // #8C6D45
  doc.text(coupleNames.toUpperCase(), pageWidth / 2, currentY, { align: "center" });

  currentY += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text("Cronograma do Dia do Evento", pageWidth / 2, currentY, { align: "center" });

  currentY += 6;
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  const dateStr = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.text(`Documento gerado em ${dateStr}`, pageWidth / 2, currentY, { align: "center" });

  currentY += 6;

  // Linha divisória do cabeçalho
  doc.setDrawColor(225, 215, 200);
  doc.setLineWidth(0.5);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);

  currentY += 12;

  // --- VERTICAL TIMELINE DESIGN ---
  const lineX = 35; // Posição X da linha vertical do cronograma
  const contentX = 45; // Posição X do conteúdo dos eventos
  const maxContentWidth = pageWidth - marginX - contentX; // Largura do texto (210 - 20 - 45 = 145mm)

  let startYForPage = currentY;

  sortedEvents.forEach((event, index) => {
    // Estimar a altura necessária para este evento
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const descLines = event.description
      ? doc.splitTextToSize(event.description, maxContentWidth)
      : [];

    const itemHeight = 12 + descLines.length * 4.5 + 8; // Altura total estimada do card/bloco

    // Verificar se estouro de página
    if (currentY + itemHeight > pageHeight - 25) {
      // Desenhar linha vertical restante da página atual antes de quebrar
      doc.setDrawColor(210, 195, 175);
      doc.setLineWidth(0.8);
      doc.line(lineX, startYForPage - 2, lineX, currentY);

      doc.addPage();
      currentY = 25;
      startYForPage = currentY;

      // Redesenhar um cabeçalho simples de continuação
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(140, 109, 69);
      doc.text(`${coupleNames} - Cronograma (Continuação)`, marginX, currentY - 8);
      
      doc.setDrawColor(225, 215, 200);
      doc.setLineWidth(0.3);
      doc.line(marginX, currentY - 5, pageWidth - marginX, currentY - 5);
    }

    const eventStartY = currentY;

    // 1. Ponto na linha vertical (Timeline Dot)
    doc.setFillColor(140, 109, 69); // #8C6D45
    doc.circle(lineX, eventStartY + 3, 2.5, "F");

    // Borda clara ao redor do ponto
    doc.setDrawColor(243, 236, 227);
    doc.setLineWidth(0.6);
    doc.circle(lineX, eventStartY + 3, 3.2, "S");

    // 2. Horário (Badge ou texto destacado)
    doc.setFont("courier", "bold");
    doc.setFontSize(11);
    doc.setTextColor(140, 109, 69);
    doc.text(event.time, contentX, eventStartY + 4);

    // 3. Título do Evento
    const timeWidth = doc.getTextWidth(event.time);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(24, 24, 27); // Zinc-900
    doc.text(event.title, contentX + timeWidth + 4, eventStartY + 4);

    currentY += 8;

    // 4. Descrição (se houver)
    if (descLines.length > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(82, 82, 91); // Zinc-600
      descLines.forEach((line: string) => {
        doc.text(line, contentX, currentY);
        currentY += 4.5;
      });
    }

    currentY += 6; // Espaçamento entre eventos

    // Desenhar segmento de linha vertical conectando ao próximo evento
    const isLast = index === sortedEvents.length - 1;
    const endYLine = isLast ? currentY - 4 : currentY;
    
    doc.setDrawColor(210, 195, 175);
    doc.setLineWidth(0.8);
    doc.line(lineX, eventStartY + 6, lineX, endYLine);
  });

  // --- RODAPÉ EM TODAS AS PÁGINAS ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);

    // Linha superior do rodapé
    doc.setDrawColor(240, 240, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 15, pageWidth - marginX, pageHeight - 15);

    // Texto rodapé
    doc.text(
      `${coupleNames} • Cronograma Oficial`,
      marginX,
      pageHeight - 10
    );
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - marginX,
      pageHeight - 10,
      { align: "right" }
    );
  }

  // Salvar PDF
  doc.save("cronograma-casamento-lucas-e-giovanna.pdf");
  return true;
}
