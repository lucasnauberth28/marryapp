import { formatarDataBrasiliaLonga, formatarDataCivilLonga } from "@/lib/formatacao/data";

// Vencimento e registro são datas de calendário, gravadas à meia-noite UTC
export const formatarDataOuVazio = (iso: string | null, calendar = false) => (iso ? (calendar ? formatarDataCivilLonga : formatarDataBrasiliaLonga)(new Date(iso)) : null);
