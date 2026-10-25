import { AlertTriangle } from "lucide-react";
import { SeletorDeData } from "@/components/ui/date-picker";
import { Entrada } from "@/components/ui/input";
import { destaqueLegivel } from "@/lib/wedding-format";
import { CampoDeFoto } from "../campo-de-foto";
import { CampoDoEditor } from "../campo-do-editor";
import { paraCampoDeData } from "../utilitarios";
import type { EditorDoSite, EnvioDeFoto } from "../use-configuracoes-do-site";

const COR_PADRAO = "#5E2B4E";

function CampoDeCor({ site }: { site: EditorDoSite }) {
  const { configuracoes, atualizar } = site;
  const destaque = destaqueLegivel(configuracoes.themeColor || COR_PADRAO);
  return (
    <CampoDoEditor id="themeColor" label="Cor do site">
      <div className="flex items-center gap-2">
        <input
          id="themeColor"
          type="color"
          value={configuracoes.themeColor || COR_PADRAO}
          onChange={(e) => atualizar({ themeColor: e.target.value })}
          className="h-12 w-14 shrink-0 cursor-pointer rounded-xl border border-linha-forte bg-papel p-1"
          aria-describedby="themeColor-hint"
        />
        <Entrada id="themeColorCode" label="Código da cor" value={configuracoes.themeColor || ""} onChange={(e) => atualizar({ themeColor: e.target.value })} fieldClassName="flex-1" inputClassName="font-mono uppercase" maxLength={7} />
      </div>
      <p id="themeColor-hint" className="flex items-start gap-1.5 text-sm text-tinta-suave">
        {destaque.adjusted ? (
          <>
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-aviso" aria-hidden="true" />
            Cor clara demais para texto: o site usa um tom mais escuro para manter a leitura.
          </>
        ) : (
          "Usada em botões, títulos e detalhes do site."
        )}
      </p>
    </CampoDoEditor>
  );
}

export function SecaoCapa({ site, foto }: { site: EditorDoSite; foto: EnvioDeFoto }) {
  const { configuracoes, atualizar } = site;
  return (
    <>
      <Entrada id="title" label="Nomes do casal" value={configuracoes.title || ""} onChange={(e) => atualizar({ title: e.target.value })} placeholder="Ana & Pedro" inputClassName="text-base font-semibold" />
      <SeletorDeData
        id="weddingDate"
        label="Data do casamento"
        value={paraCampoDeData(configuracoes.weddingDate)}
        onChange={(e) => atualizar({ weddingDate: e.target.value ? `${e.target.value}T12:00:00.000Z` : null })}
      />
      <Entrada id="subtitle" label="Frase acima dos nomes" optional hint="Ex.: “Vamos nos casar!”" value={configuracoes.subtitle || ""} onChange={(e) => atualizar({ subtitle: e.target.value })} />
      <CampoDeCor site={site} />
      <CampoDeFoto campo="heroImageUrl" label="Foto da capa" hint="Aparece em um arco vertical no topo do site. Prefira uma foto em pé, com vocês no centro. JPG, PNG ou WEBP de até 5 MB." site={site} foto={foto} />
    </>
  );
}
