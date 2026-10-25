import { useRef } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { Esqueleto } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TIPOS_ACEITOS } from "./comprimir-imagem";
import { ESTILO_DA_DICA, ESTILO_DO_BOTAO_DE_ICONE, ESTILO_DO_BOTAO_SECUNDARIO } from "./estilos";

interface PropriedadesDoBlocoDeImagem {
  titulo: string;
  url: string | null;
  alt: string;
  icone: React.ReactNode;
  caixa: string;
  enviando: boolean;
  ocupado: boolean;
  rotuloDeEnviar: string;
  rotuloDeTrocar: string;
  rotuloDeRemover: string;
  /** Texto só para leitores de tela, depois do rótulo do botão. */
  complementoDoBotao?: string;
  dica?: string;
  className?: string;
  aoEscolher: (e: React.ChangeEvent<HTMLInputElement>) => void;
  aoRemover: () => void;
}

/** Logo ou capa: a imagem atual, enviar ou trocar, e remover. */
export function BlocoDeImagem(p: PropriedadesDoBlocoDeImagem) {
  const entrada = useRef<HTMLInputElement>(null);
  return (
    <div className={cn("flex flex-col gap-2", p.className)}>
      <p className="text-sm font-semibold text-tinta">{p.titulo}</p>
      <div className={cn("relative grid place-items-center overflow-hidden rounded-2xl border border-linha bg-areia", p.caixa)}>
        {p.enviando ? <Esqueleto className="absolute inset-0 z-10 rounded-none" /> : null}
        {p.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.url} alt={p.alt} className="size-full object-cover" />
        ) : (
          p.icone
        )}
      </div>
      <input ref={entrada} type="file" accept={TIPOS_ACEITOS} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={p.aoEscolher} />
      <div className="flex gap-2">
        <button type="button" disabled={p.ocupado} onClick={() => entrada.current?.click()} className={ESTILO_DO_BOTAO_SECUNDARIO}>
          {p.enviando ? <Loader2 aria-hidden="true" className="size-[18px] animate-spin" /> : <Upload aria-hidden="true" className="size-[18px]" />}
          {p.url ? p.rotuloDeTrocar : p.rotuloDeEnviar}
          {p.complementoDoBotao ? <span className="sr-only"> {p.complementoDoBotao}</span> : null}
        </button>
        {p.url ? (
          <button type="button" disabled={p.ocupado} onClick={p.aoRemover} aria-label={p.rotuloDeRemover} className={ESTILO_DO_BOTAO_DE_ICONE}>
            <Trash2 aria-hidden="true" className="size-[18px]" />
          </button>
        ) : null}
      </div>
      {p.dica ? <p className={ESTILO_DA_DICA}>{p.dica}</p> : null}
    </div>
  );
}
