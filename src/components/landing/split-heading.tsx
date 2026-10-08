import { Fragment } from "react";

type Part = string | { em: string };
type Seg = { text: string; em: boolean };

/**
 * Título display que entra palavra por palavra (mesma animação do RevealWords),
 * com suporte a uma palavra em itálico ameixa. Leitores de tela recebem a frase inteira.
 * Uma parte que começa sem espaço (ex.: ".") gruda na palavra anterior.
 */
export function SplitWords({ parts, baseDelay = 0, step = 70 }: { parts: Part[]; baseDelay?: number; step?: number }) {
  const words: Seg[][] = [];
  let glue = false;
  for (const part of parts) {
    const em = typeof part !== "string";
    const raw = typeof part === "string" ? part : part.em;
    const tokens = raw.split(/(\s+)/);
    for (const token of tokens) {
      if (token === "") continue;
      if (/^\s+$/.test(token)) {
        glue = false;
        continue;
      }
      if (glue && words.length) words[words.length - 1].push({ text: token, em });
      else words.push([{ text: token, em }]);
      glue = true;
    }
  }
  const full = parts
    .map((p) => (typeof p === "string" ? p : p.em))
    .join("")
    .replace(/\s+/g, " ")
    .trim();

  return (
    <>
      <span className="sr-only">{full}</span>
      <span aria-hidden="true">
        {words.map((segs, i) => (
          <Fragment key={i}>
            <span className="inline-block overflow-hidden pb-[0.14em] align-bottom">
              <span data-reveal="word" suppressHydrationWarning className="inline-block" style={{ ["--reveal-delay" as string]: `${baseDelay + i * step}ms` }}>
                {segs.map((s, j) =>
                  s.em ? (
                    <em key={j} className="italic text-ameixa">
                      {s.text}
                    </em>
                  ) : (
                    <Fragment key={j}>{s.text}</Fragment>
                  ),
                )}
              </span>
            </span>
            {i < words.length - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
    </>
  );
}
