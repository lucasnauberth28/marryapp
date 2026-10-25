import { useRef } from "react";
import { Upload } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { BotaoComCarregamento } from "@/components/painel/loading-button";
import { Entrada } from "@/components/ui/input";
import { Esqueleto } from "@/components/ui/skeleton";
import { ImagemDaPessoa } from "@/components/ui/user-image";
import { CampoDoEditor } from "./campo-do-editor";
import type { CampoDeFoto as NomeDoCampoDeFoto } from "./tipos";
import type { EditorDoSite, EnvioDeFoto } from "./use-configuracoes-do-site";

interface PropriedadesDoCampoDeFoto {
  campo: NomeDoCampoDeFoto;
  label: string;
  hint: string;
  site: EditorDoSite;
  foto: EnvioDeFoto;
}

function Miniatura({ url, label, enviando }: { url?: string | null; label: string; enviando: boolean }) {
  return (
    <div className="relative grid aspect-[3/4] w-[72px] shrink-0 place-items-center overflow-hidden rounded-t-full bg-areia text-center text-[11px] text-tinta-suave">
      {enviando ? (
        <>
          <span className="sr-only" role="status">Enviando a foto...</span>
          <Esqueleto className="absolute inset-0 rounded-none" />
        </>
      ) : url ? (
        <ImagemDaPessoa src={url} alt={`Foto atual: ${label.toLowerCase()}`} sizes="72px" className="object-cover" />
      ) : (
        <span className="px-1">Sem foto</span>
      )}
    </div>
  );
}

/** Foto do site: miniatura, botão de enviar/trocar e, para quem prefere, o link da foto. */
export function CampoDeFoto({ campo, label, hint, site, foto }: PropriedadesDoCampoDeFoto) {
  const entrada = useRef<HTMLInputElement>(null);
  const url = site.configuracoes[campo];
  return (
    <CampoDoEditor id={campo} group label={label} hint={hint}>
      <div className="flex items-center gap-3">
        <Miniatura url={url} label={label} enviando={foto.enviando === campo} />
        <input
          ref={entrada}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          aria-label={`Enviar ${label.toLowerCase()}`}
          onChange={(e) => foto.enviarFoto(campo, e.target.files?.[0])}
        />
        <BotaoComCarregamento className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm}`} loading={foto.enviando === campo} disabled={foto.enviando !== null} onClick={() => entrada.current?.click()}>
          <Upload className="size-4" aria-hidden="true" />
          {url ? "Trocar foto" : "Enviar foto"}
        </BotaoComCarregamento>
      </div>
      <Entrada id={`${campo}-link`} label="Ou cole o link da foto" value={url || ""} onChange={(e) => site.atualizar({ [campo]: e.target.value })} placeholder="https://..." fieldClassName="mt-1" />
    </CampoDoEditor>
  );
}
