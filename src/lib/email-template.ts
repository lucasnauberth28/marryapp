import { urlDoApp } from "./app-url.ts";

function escaparHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface EntradaDoEmailDaMarca {
  /** Título grande do e-mail. */
  heading: string;
  /** Parágrafos antes do botão (texto puro, escapado aqui). */
  paragraphs: string[];
  cta?: { label: string; url: string };
  /** Parágrafos menores depois do botão (ex.: validade do link, "se não foi você..."). */
  footnotes?: string[];
  /** Texto curto que aparece na prévia da caixa de entrada. */
  preheader?: string;
}

// Cores do Manual de Marca (p.9): papel, branco, linha, tinta, grafite e ameixa. Clientes de e-mail não leem variáveis CSS.
const CORES_DO_EMAIL = { papel: "#FCFBFA", branco: "#FFFFFF", linha: "#E8E2E5", tinta: "#1F1A1D", grafite: "#5F585C", ameixa: "#5E2B4E" } as const;
const FONTE_DO_EMAIL = "Arial,Helvetica,sans-serif";

/** Assinatura horizontal em PNG (e-mail não aceita SVG de forma confiável), com endereço absoluto. 160 px é a largura mínima do manual. */
const CAMINHO_DO_LOGOTIPO_DO_EMAIL = "/brand/aceito-lockup-email.png";

/**
 * Modelo simples com a identidade do Aceito (papel, branco, ameixa), em tabelas e estilos inline
 * para funcionar nos clientes de e-mail. Devolve também a versão em texto puro.
 */
export function emailDaMarca({ heading, paragraphs, cta, footnotes = [], preheader }: EntradaDoEmailDaMarca): { html: string; text: string } {
  const p = (t: string, style: string) => `<p style="margin:0 0 16px;${style}">${escaparHtml(t)}</p>`;
  const button = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="border-radius:999px;background:${CORES_DO_EMAIL.ameixa}">
<a href="${escaparHtml(cta.url)}" style="display:inline-block;padding:14px 28px;font-family:${FONTE_DO_EMAIL};font-size:16px;font-weight:bold;color:${CORES_DO_EMAIL.branco};text-decoration:none;border-radius:999px">${escaparHtml(cta.label)}</a>
</td></tr></table>
<p style="margin:0 0 16px;font-size:13px;line-height:20px;color:${CORES_DO_EMAIL.grafite}">Se o botão não abrir, copie este endereço no navegador:<br><a href="${escaparHtml(cta.url)}" style="color:${CORES_DO_EMAIL.ameixa};word-break:break-all">${escaparHtml(cta.url)}</a></p>`
    : "";

  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escaparHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:${CORES_DO_EMAIL.papel}">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escaparHtml(preheader)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CORES_DO_EMAIL.papel};padding:32px 16px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:0 8px 20px"><img src="${escaparHtml(urlDoApp(CAMINHO_DO_LOGOTIPO_DO_EMAIL))}" width="160" height="26" alt="Aceito" style="display:block;border:0;outline:none;height:26px;width:160px"></td></tr>
<tr><td style="background:${CORES_DO_EMAIL.branco};border:1px solid ${CORES_DO_EMAIL.linha};border-radius:20px;padding:32px 28px;font-family:${FONTE_DO_EMAIL};font-size:16px;line-height:24px;color:${CORES_DO_EMAIL.tinta}">
<h1 style="margin:0 0 16px;font-family:Urbanist,${FONTE_DO_EMAIL};font-weight:600;font-size:28px;line-height:34px;color:${CORES_DO_EMAIL.tinta}">${escaparHtml(heading)}</h1>
${paragraphs.map((t) => p(t, "")).join("\n")}
${button}
${footnotes.map((t) => p(t, `font-size:13px;line-height:20px;color:${CORES_DO_EMAIL.grafite}`)).join("\n")}
</td></tr>
<tr><td style="padding:20px 8px 0;font-family:${FONTE_DO_EMAIL};font-size:12px;line-height:18px;color:${CORES_DO_EMAIL.grafite}">Aceito · Do convite ao grande dia, tudo num só sim.<br>Este é um e-mail automático; não é preciso responder.</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  const text = [
    heading,
    "",
    ...paragraphs,
    ...(cta ? ["", `${cta.label}: ${cta.url}`] : []),
    ...(footnotes.length ? ["", ...footnotes] : []),
    "",
    "Aceito · Do convite ao grande dia, tudo num só sim.",
  ].join("\n");

  return { html, text };
}
