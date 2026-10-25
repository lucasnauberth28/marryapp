// Datas em português do Brasil. Sem dependências: roda no servidor, no navegador e nos testes.
// "Data civil" é o dia do calendário (casamento, vencimento), gravado à meia-noite UTC: formatar em UTC evita voltar um dia.
// "Brasília" é para o instante em que algo aconteceu: sempre no horário de Brasília, onde está quem usa o app.

type Momento = Date | number;

const FUSO_BRASILIA = "America/Sao_Paulo";

const civilLonga = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const civilSemAno = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", timeZone: "UTC" });
const civilCurta = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" });
const brasiliaLonga = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: FUSO_BRASILIA });
const brasiliaSemAno = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", timeZone: FUSO_BRASILIA });
const brasiliaCurtaComAno = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric", timeZone: FUSO_BRASILIA });

/** Data civil por extenso: "25 de outubro de 2026". */
export const formatarDataCivilLonga = (data: Momento): string => civilLonga.format(data);

/** Data civil sem o ano: "25 de outubro". */
export const formatarDataCivilSemAno = (data: Momento): string => civilSemAno.format(data);

/** Data civil abreviada: "25 de out.". */
export const formatarDataCivilCurta = (data: Momento): string => civilCurta.format(data);

/** Instante por extenso no horário de Brasília: "25 de outubro de 2026". */
export const formatarDataBrasiliaLonga = (data: Momento): string => brasiliaLonga.format(data);

/** Instante sem o ano no horário de Brasília: "25 de outubro". */
export const formatarDataBrasiliaSemAno = (data: Momento): string => brasiliaSemAno.format(data);

/** Instante abreviado, com o ano, no horário de Brasília: "25 de out. de 2026". */
export const formatarDataBrasiliaCurtaComAno = (data: Momento): string => brasiliaCurtaComAno.format(data);
