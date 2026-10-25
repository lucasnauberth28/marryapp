import type { EventoDaLinhaDoTempoNoPdf } from "@/lib/generate-timeline-pdf";

export type EventoDaLinhaDoTempo = EventoDaLinhaDoTempoNoPdf & { position?: number; icon?: string };

/** "14:00" vira "14h" e "19:30" vira "19h30". */
export function rotuloDaHora(time: string) {
  const m = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!m) return time;
  const h = Number(m[1]);
  return m[2] === "00" ? `${h}h` : `${h}h${m[2]}`;
}
