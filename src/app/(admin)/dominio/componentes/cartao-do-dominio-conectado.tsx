import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, ExternalLink, Globe } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { cn } from "@/lib/utils";

export function CartaoDoDominioConectado({ domain }: { domain: string }) {
  const url = `https://${domain}`;
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado.");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Não foi possível copiar. Selecione o endereço e copie à mão.");
    }
  }

  return (
    <section aria-labelledby="dominio-no-ar" className="flex flex-col gap-4 rounded-2xl bg-ameixa p-5 text-on-ameixa shadow-[var(--shadow-aceito-2)] sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-on-ameixa/15">
          <Globe className="size-5" aria-hidden="true" />
        </span>
        <h2 id="dominio-no-ar" className="text-xl font-semibold leading-7">
          O site de vocês está no ar
        </h2>
      </div>
      <p className="break-all font-display text-[28px] leading-8 sm:text-[34px] sm:leading-10">{domain}</p>
      <p className="text-[15px] leading-6">Os links enviados aos convidados já usam este endereço.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <a href={url} target="_blank" rel="noopener noreferrer" className={cn(estiloDoBotao.onAmeixa, "min-h-11")}>
          <ExternalLink className="size-4" aria-hidden="true" />
          Abrir o site
          <span className="sr-only"> (abre em outra aba)</span>
        </a>
        <button type="button" onClick={copy} className={cn(estiloDoBotao.onAmeixa, "min-h-11 bg-transparent text-on-ameixa ring-1 ring-on-ameixa/50 hover:bg-on-ameixa/10")}>
          {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          {copied ? "Link copiado" : "Copiar o link"}
        </button>
      </div>
    </section>
  );
}
