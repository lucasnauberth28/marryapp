"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

/** Uma linha dos "Links do casal": nome, endereço, copiar e abrir. */
export function LinkRow({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const display = url.replace(/^https?:\/\//, "");

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // sem permissão de área de transferência: o endereço continua visível para copiar à mão
    }
  }

  const iconButton = "grid size-11 place-items-center rounded-xl text-tinta-suave transition-colors hover:bg-ameixa-suave hover:text-ameixa focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ameixa sm:size-10";
  return (
    <li className="flex items-center gap-2 border-b border-linha py-3 first:pt-0 last:border-b-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-6 text-tinta">{label}</p>
        <p className="truncate font-mono text-sm leading-5 text-tinta-suave">{display}</p>
      </div>
      <button type="button" onClick={copy} className={iconButton} aria-label={copied ? `Endereço copiado: ${label}` : `Copiar o endereço: ${label}`}>
        {copied ? <Check className="size-5 text-sucesso" aria-hidden="true" /> : <Copy className="size-5" aria-hidden="true" />}
      </button>
      <a href={url} target="_blank" rel="noopener noreferrer" className={iconButton} aria-label={`Abrir em outra aba: ${label}`}>
        <ExternalLink className="size-5" aria-hidden="true" />
      </a>
    </li>
  );
}
