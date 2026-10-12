import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {
  THEME_INIT_SCRIPT,
  isLightOnlyPath,
  parseThemePreference,
  readThemeFromCookie,
  resolveTheme,
  serializeThemeCookie,
  type ThemePreference,
} from "../theme.ts";

test("preferência desconhecida vira Do aparelho", () => {
  assert.equal(parseThemePreference("dark"), "dark");
  assert.equal(parseThemePreference("light"), "light");
  assert.equal(parseThemePreference("system"), "system");
  assert.equal(parseThemePreference("escuro"), "system");
  assert.equal(parseThemePreference(null), "system");
});

test("lê a preferência do cabeçalho Cookie entre outros cookies", () => {
  assert.equal(readThemeFromCookie("a=1; aceito-theme=dark; b=2"), "dark");
  assert.equal(readThemeFromCookie("aceito-theme=system"), "system");
  assert.equal(readThemeFromCookie("xaceito-theme=dark"), null);
  assert.equal(readThemeFromCookie("aceito-theme=roxo"), null);
  assert.equal(readThemeFromCookie(""), null);
  assert.equal(readThemeFromCookie(undefined), null);
});

test("o cookie gravado volta igual na leitura e dura um ano", () => {
  for (const p of ["light", "dark", "system"] as const) {
    const c = serializeThemeCookie(p);
    assert.equal(readThemeFromCookie(c.split(";")[0]), p);
    assert.match(c, /Max-Age=31536000/);
    assert.match(c, /Path=\//);
  }
});

test("escolha explícita vence o sistema; Do aparelho segue o sistema", () => {
  assert.equal(resolveTheme({ preference: "light", systemDark: true }), "light");
  assert.equal(resolveTheme({ preference: "dark", systemDark: false }), "dark");
  assert.equal(resolveTheme({ preference: "system", systemDark: true }), "dark");
  assert.equal(resolveTheme({ preference: "system", systemDark: false }), "light");
});

test("site do casal e páginas do convidado ficam sempre claros", () => {
  for (const path of ["/casamento/ana-e-bia", "/casamento/ana-e-bia/rsvp", "/casamento", "/rsvp", "/presentes", "/dia-do-evento"]) {
    assert.equal(isLightOnlyPath(path), true, path);
    assert.equal(resolveTheme({ preference: "dark", systemDark: true, pathname: path }), "light", path);
  }
  // Prefixo parecido não conta; o restante do app segue a escolha.
  for (const path of ["/", "/planos", "/casamentos-reais", "/dashboard", "/rsvpx", "/admin", "/login"]) {
    assert.equal(isLightOnlyPath(path), false, path);
    assert.equal(resolveTheme({ preference: "dark", systemDark: false, pathname: path }), "dark", path);
  }
});

// O script inline não pode divergir da lógica acima: executamos o texto dele e comparamos.
function runInitScript(opts: { cookie?: string; stored?: string | null; systemDark: boolean; pathname: string; storageThrows?: boolean }) {
  let applied: string | null = null;
  const context = {
    document: {
      cookie: opts.cookie ?? "",
      documentElement: { setAttribute: (k: string, v: string) => { if (k === "data-theme") applied = v; } },
    },
    localStorage: {
      getItem: () => {
        if (opts.storageThrows) throw new Error("bloqueado");
        return opts.stored ?? null;
      },
    },
    matchMedia: () => ({ matches: opts.systemDark }),
    location: { pathname: opts.pathname },
  };
  vm.runInNewContext(THEME_INIT_SCRIPT, context);
  return applied;
}

test("script do head aplica o mesmo tema que resolveTheme", () => {
  const prefs: ThemePreference[] = ["light", "dark", "system"];
  for (const preference of prefs) {
    for (const systemDark of [true, false]) {
      for (const pathname of ["/", "/planos", "/casamento/x", "/casamento/x/presentes", "/rsvp", "/rsvpx"]) {
        const got = runInitScript({ cookie: `aceito-theme=${preference}`, systemDark, pathname });
        assert.equal(got, resolveTheme({ preference, systemDark, pathname }), `${preference} ${systemDark} ${pathname}`);
      }
    }
  }
});

test("script do head: sem cookie usa o localStorage; sem nada ou com erro, o sistema", () => {
  assert.equal(runInitScript({ stored: "dark", systemDark: false, pathname: "/" }), "dark");
  assert.equal(runInitScript({ systemDark: true, pathname: "/" }), "dark");
  assert.equal(runInitScript({ systemDark: false, pathname: "/" }), "light");
  assert.equal(runInitScript({ storageThrows: true, systemDark: true, pathname: "/" }), "dark");
  // Cookie lixo é ignorado como "system".
  assert.equal(runInitScript({ cookie: "aceito-theme=roxo", systemDark: true, pathname: "/" }), "dark");
});
