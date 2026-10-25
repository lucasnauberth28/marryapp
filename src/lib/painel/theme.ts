// Tema claro/escuro: lógica pura (sem React nem DOM), usada pelo provider e testada à parte.
// A escolha vive em cookie (e em localStorage só como reserva); o <html> recebe data-theme="light|dark".

export type PreferenciaDeTema = "light" | "dark" | "system";
export type TemaAplicado = "light" | "dark";

export const CHAVE_DO_TEMA = "aceito-theme";
const DURACAO_DO_COOKIE_DO_TEMA = 60 * 60 * 24 * 365;

export const OPCOES_DE_TEMA: ReadonlyArray<{ value: PreferenciaDeTema; label: string }> = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
  { value: "system", label: "Do aparelho" },
];

/** O tema claro é o principal: sem escolha gravada (ou valor desconhecido) vale "light". "Do aparelho" só por escolha explícita. */
export function interpretarPreferenciaDeTema(value: unknown): PreferenciaDeTema {
  return value === "dark" || value === "system" ? value : "light";
}

/** Lê a preferência de um cabeçalho Cookie (ou document.cookie). null = nada gravado. */
export function lerTemaDoCookie(cookie: string | null | undefined): PreferenciaDeTema | null {
  if (!cookie) return null;
  for (const part of cookie.split(";")) {
    const i = part.indexOf("=");
    if (i < 0 || part.slice(0, i).trim() !== CHAVE_DO_TEMA) continue;
    const raw = part.slice(i + 1).trim();
    return raw === "light" || raw === "dark" || raw === "system" ? raw : null;
  }
  return null;
}

export function serializarCookieDoTema(preference: PreferenciaDeTema): string {
  return `${CHAVE_DO_TEMA}=${preference}; Path=/; Max-Age=${DURACAO_DO_COOKIE_DO_TEMA}; SameSite=Lax`;
}

/**
 * Rotas que ficam SEMPRE claras: o site do casal e as páginas por link do convidado usam a cor e as
 * fotos escolhidas pelos noivos e são pensadas como papelaria.
 * Mantenha em sincronia com LIGHT_ONLY_SOURCE (o script que roda antes da pintura).
 */
const SOMENTE_CLARO = /^\/(casamento(\/|$)|rsvp(\/|$)|presentes(\/|$)|dia-do-evento(\/|$))/;
const ORIGEM_SOMENTE_CLARO = "^\\/(casamento(\\/|$)|rsvp(\\/|$)|presentes(\\/|$)|dia-do-evento(\\/|$))";

export function ehCaminhoSomenteClaro(pathname: string | null | undefined): boolean {
  return !!pathname && SOMENTE_CLARO.test(pathname);
}

/** Tema que vai para o <html>: rota só-clara > escolha explícita > (só em "Do aparelho") preferência do sistema. */
export function resolverTema(input: {
  preference: PreferenciaDeTema;
  systemDark: boolean;
  pathname?: string | null;
}): TemaAplicado {
  if (ehCaminhoSomenteClaro(input.pathname)) return "light";
  if (input.preference === "light" || input.preference === "dark") return input.preference;
  return input.systemDark ? "dark" : "light";
}

/**
 * Script inline do <head>: roda ANTES da primeira pintura e põe data-theme no <html>.
 * Não lê cookie no servidor de propósito: isso tornaria dinâmicas a home, os planos, /login etc.
 * (hoje estáticas/ISR). Mesma regra de resolveTheme; o teste executa este texto e compara.
 */
export const SCRIPT_INICIAL_DO_TEMA =
  `(function(){try{var d=document.documentElement,k="${CHAVE_DO_TEMA}",p=null,m=document.cookie.match(new RegExp("(?:^|; )"+k+"=([^;]*)"));` +
  `if(m)p=m[1];else{try{p=localStorage.getItem(k)}catch(e){}}` +
  `var t=new RegExp(${JSON.stringify(ORIGEM_SOMENTE_CLARO)}).test(location.pathname)?"light":p==="dark"?"dark":p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";` +
  `d.setAttribute("data-theme",t)}catch(e){}})()`;
