// Registros DNS que a Vercel pede para ligar um domínio ao projeto: lidos da resposta da API, com valores padrão
// conhecidos quando ela não os devolve. Tolerante: campo que falta vira o padrão e a resposta nunca derruba a tela.

export interface RegistroDns {
  type: "A" | "CNAME" | "TXT";
  /** Nome do registro na zona do domínio: "@" (raiz), "www" ou "_vercel". */
  name: string;
  value: string;
  /** "vercel" = valor devolvido pela Vercel; "default" = valor padrão conhecido quando a Vercel não devolveu. */
  source: "vercel" | "default";
}

/** Valores padrão da Vercel, usados só se a resposta não trouxer os recomendados. */
export const REGISTRO_A_PADRAO = "76.76.21.21";
export const CNAME_PADRAO = "cname.vercel-dns.com";

export interface RespostaBruta {
  status: number;
  body: Record<string, unknown> | null;
}

export const ehObjeto = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
export const converterEmTexto = (v: unknown) => (typeof v === "string" ? v : "");

/** Código de erro da Vercel: { error: { code, message } }. */
export function codigoDoErro(body: RespostaBruta["body"]): string {
  const err = body && ehObjeto(body.error) ? body.error : null;
  return err ? converterEmTexto(err.code) : "";
}

/** Registros TXT que a Vercel pede quando o domínio ainda não foi provado como nosso. */
export function registrosDeVerificacao(domainBody: RespostaBruta["body"]): RegistroDns[] {
  const list = domainBody && Array.isArray(domainBody.verification) ? domainBody.verification : [];
  const out: RegistroDns[] = [];
  for (const item of list) {
    if (!ehObjeto(item)) continue;
    const type = converterEmTexto(item.type).toUpperCase();
    const value = converterEmTexto(item.value);
    const host = converterEmTexto(item.domain);
    if (type !== "TXT" || !value || !host) continue;
    out.push({ type: "TXT", name: host, value, source: "vercel" });
  }
  return out;
}

/** Registros A (raiz) e CNAME (www) a criar, com os valores recomendados da Vercel. */
export function registrosDnsDaConfiguracao(configBody: RespostaBruta["body"]): RegistroDns[] {
  let ipv4 = "";
  let cname = "";
  if (configBody) {
    const ips = Array.isArray(configBody.recommendedIPv4) ? configBody.recommendedIPv4.filter(ehObjeto) : [];
    ips.sort((a, b) => Number(a.rank ?? 99) - Number(b.rank ?? 99));
    for (const entry of ips) {
      const value = Array.isArray(entry.value) ? entry.value.find((v): v is string => typeof v === "string") : converterEmTexto(entry.value);
      if (value) {
        ipv4 = value;
        break;
      }
    }
    const names = Array.isArray(configBody.recommendedCNAME) ? configBody.recommendedCNAME.filter(ehObjeto) : [];
    names.sort((a, b) => Number(a.rank ?? 99) - Number(b.rank ?? 99));
    cname = names.map((n) => converterEmTexto(n.value)).find(Boolean) ?? "";
  }
  const fromVercel = Boolean(ipv4);
  return [
    { type: "A", name: "@", value: ipv4 || REGISTRO_A_PADRAO, source: fromVercel ? "vercel" : "default" },
    { type: "CNAME", name: "www", value: (cname || CNAME_PADRAO).replace(/\.$/, ""), source: cname ? "vercel" : "default" },
  ];
}
