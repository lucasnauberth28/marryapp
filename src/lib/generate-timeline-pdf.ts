import jsPDF from "jspdf";
import { nomeDoArquivoPdfDaLinhaDoTempo } from "@/lib/timeline-pdf-name";
import { abrirPaginaDeContinuacao, desenharCabecalho, desenharPonto, desenharRodapes, desenharTextoDoEvento, medidasDaPagina, medirEvento, type EventoDaLinhaDoTempoNoPdf } from "./timeline-pdf/desenho";

export type { EventoDaLinhaDoTempoNoPdf };

export function gerarPdfDaLinhaDoTempo(events: EventoDaLinhaDoTempoNoPdf[], coupleNames = "Nosso Casamento") {
  if (!events || events.length === 0) return false;

  // Ordenar os eventos por horário
  const sortedEvents = [...events].sort((a, b) => a.time.localeCompare(b.time));
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const { altura } = medidasDaPagina(doc);

  let currentY = desenharCabecalho(doc, coupleNames);
  // Centro do ponto anterior na página atual
  let previousDotY: number | null = null;

  for (const event of sortedEvents) {
    const medidas = medirEvento(doc, event);

    // Estouro de página
    if (currentY + medidas.altura > altura - 25) {
      currentY = abrirPaginaDeContinuacao(doc, coupleNames);
      previousDotY = null;
    }

    const dotY = currentY + 3;
    desenharPonto(doc, dotY, previousDotY);
    previousDotY = dotY;
    currentY = desenharTextoDoEvento(doc, event, medidas, currentY);
  }

  desenharRodapes(doc, coupleNames);
  doc.save(nomeDoArquivoPdfDaLinhaDoTempo(coupleNames));
  return true;
}
