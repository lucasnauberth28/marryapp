/** Assina um relógio de um minuto: no servidor devolve null, e a tela só marca "Agora" no navegador. */
export function assinarRelogio(onTick: () => void) {
  const id = setInterval(onTick, 60_000);
  return () => clearInterval(id);
}
export const minutoAtual = () => Math.floor(Date.now() / 60_000);
export const semRelogio = () => null;

const FUSO_DE_BRASILIA = "America/Sao_Paulo";

export function agoraEmBrasilia(minute: number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO_DE_BRASILIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(minute * 60_000));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return { day: `${get("year")}-${get("month")}-${get("day")}`, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

export function emMinutos(time: string) {
  const [h, m] = time.split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
}

/** "16:30" vira "16h30" e "16:00" vira "16h", como no design. */
export function horaCurta(time: string) {
  const [h, m] = time.split(":");
  if (h === undefined || m === undefined) return time;
  return m === "00" ? `${Number(h)}h` : `${Number(h)}h${m}`;
}
