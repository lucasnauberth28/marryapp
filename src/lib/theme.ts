// Tema claro/escuro: lógica pura (sem React nem DOM), usada pelo provider e testada à parte.
// A escolha vive em cookie (e em localStorage só como reserva); o <html> recebe data-theme="light|dark".

export type ThemePreference = "light" | "dark" | "system";
export type AppliedTheme = "light" | "dark";

export const THEME_KEY = "aceito-theme";
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const THEME_OPTIONS: ReadonlyArray<{ value: ThemePreference; label: string }> = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
  { value: "system", label: "Do aparelho" },
];

/** O tema claro é o principal: sem escolha gravada (ou valor desconhecido) vale "light". "Do aparelho" só por escolha explícita. */
export function parseThemePreference(value: unknown): ThemePreference {
  return value === "dark" || value === "system" ? value : "light";
}

/** Lê a preferência de um cabeçalho Cookie (ou document.cookie). null = nada gravado. */
export function readThemeFromCookie(cookie: string | null | undefined): ThemePreference | null {
  if (!cookie) return null;
  for (const part of cookie.split(";")) {
    const i = part.indexOf("=");
    if (i < 0 || part.slice(0, i).trim() !== THEME_KEY) continue;
    const raw = part.slice(i + 1).trim();
    return raw === "light" || raw === "dark" || raw === "system" ? raw : null;
  }
  return null;
}

export function serializeThemeCookie(preference: ThemePreference): string {
  return `${THEME_KEY}=${preference}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
}

/**
 * Rotas que ficam SEMPRE claras: o site do casal e as páginas por link do convidado usam a cor e as
 * fotos escolhidas pelos noivos e são pensadas como papelaria.
 * Mantenha em sincronia com LIGHT_ONLY_SOURCE (o script que roda antes da pintura).
 */
const LIGHT_ONLY = /^\/(casamento(\/|$)|rsvp(\/|$)|presentes(\/|$)|dia-do-evento(\/|$))/;
const LIGHT_ONLY_SOURCE = "^\\/(casamento(\\/|$)|rsvp(\\/|$)|presentes(\\/|$)|dia-do-evento(\\/|$))";

export function isLightOnlyPath(pathname: string | null | undefined): boolean {
  return !!pathname && LIGHT_ONLY.test(pathname);
}

/** Tema que vai para o <html>: rota só-clara > escolha explícita > (só em "Do aparelho") preferência do sistema. */
export function resolveTheme(input: {
  preference: ThemePreference;
  systemDark: boolean;
  pathname?: string | null;
}): AppliedTheme {
  if (isLightOnlyPath(input.pathname)) return "light";
  if (input.preference === "light" || input.preference === "dark") return input.preference;
  return input.systemDark ? "dark" : "light";
}

/**
 * Script inline do <head>: roda ANTES da primeira pintura e põe data-theme no <html>.
 * Não lê cookie no servidor de propósito: isso tornaria dinâmicas a home, os planos, /login etc.
 * (hoje estáticas/ISR). Mesma regra de resolveTheme; o teste executa este texto e compara.
 */
export const THEME_INIT_SCRIPT =
  `(function(){try{var d=document.documentElement,k="${THEME_KEY}",p=null,m=document.cookie.match(new RegExp("(?:^|; )"+k+"=([^;]*)"));` +
  `if(m)p=m[1];else{try{p=localStorage.getItem(k)}catch(e){}}` +
  `var t=new RegExp(${JSON.stringify(LIGHT_ONLY_SOURCE)}).test(location.pathname)?"light":p==="dark"?"dark":p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";` +
  `d.setAttribute("data-theme",t)}catch(e){}})()`;
