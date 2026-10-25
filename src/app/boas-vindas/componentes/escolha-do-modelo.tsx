"use client";
// A escolha do modelo do site logo no início: o modelo marcado aparece ao vivo com os nomes e a data de vocês.
import Image from "next/image";
import { VisaoDoSiteDoCasamento } from "@/components/public/site-do-casamento/visao-do-site";
import { MODELOS_DO_SITE, modeloDoSite, type IdDoModelo } from "@/components/public/site-do-casamento/modelos/catalogo";
import { EscopoClaro } from "@/components/theme/light-scope";
import { cn } from "@/lib/utils";

interface Propriedades {
  escolhido: IdDoModelo;
  aoEscolher: (id: IdDoModelo) => void;
  coupleNames: string;
  /** "AAAA-MM-DD" ou vazio. */
  weddingDate: string;
}

/** Só a capa: sem as demais seções (e sem o formulário do mural, que não pode ficar dentro do formulário desta tela). */
const SO_A_CAPA = { showStory: false, showGallery: false, showLocation: false, showDressCode: false, showTips: false, showGifts: false, showGuestbook: false, showMusic: false };

/** O site de verdade, na escala de uma vitrine: só o topo, sem cliques. Sem fotos, o desenho usa o monograma do casal. */
function VitrineAoVivo({ escolhido, coupleNames, weddingDate }: Omit<Propriedades, "aoEscolher">) {
  const modelo = modeloDoSite(escolhido);
  return (
    <div className="relative h-[280px] overflow-hidden rounded-xl border border-linha bg-linho" role="img" aria-label={`Prévia do modelo ${modelo.nome} com ${coupleNames}`}>
      <EscopoClaro>
        <div className="pointer-events-none select-none" style={{ zoom: 0.38 }} aria-hidden="true">
          <VisaoDoSiteDoCasamento
            slug="exemplo"
            settings={{ title: coupleNames, subtitle: "Vamos nos casar!", weddingDate: weddingDate ? `${weddingDate}T12:00:00.000Z` : null, template: modelo.id, themeColor: modelo.destaque, ...SO_A_CAPA }}
            storyItems={[]}
            tips={[]}
            guestbookEntries={[]}
            gifts={[]}
            preview
          />
        </div>
      </EscopoClaro>
    </div>
  );
}

export function EscolhaDoModelo({ escolhido, aoEscolher, coupleNames, weddingDate }: Propriedades) {
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
      <legend className="mb-1 text-sm font-semibold text-tinta">Escolham o modelo do site</legend>
      <VitrineAoVivo escolhido={escolhido} coupleNames={coupleNames} weddingDate={weddingDate} />
      <ul className="m-0 flex list-none gap-2 overflow-x-auto p-0 pb-1">
        {MODELOS_DO_SITE.map((m) => (
          <li key={m.id} className="shrink-0">
            <label className={cn("relative flex w-[92px] cursor-pointer flex-col gap-1 rounded-lg border bg-papel p-1 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ameixa", escolhido === m.id ? "border-2 border-ameixa p-[3px]" : "border-linha")}>
              <input type="radio" name="modelo-do-site" value={m.id} checked={escolhido === m.id} onChange={() => aoEscolher(m.id)} className="sr-only" />
              <Image src={`/images/modelos/${m.id}.webp`} alt="" width={800} height={500} sizes="92px" className="aspect-[8/5] w-full rounded object-cover" />
              <span className="px-0.5 text-xs font-semibold leading-4 text-tinta">{m.nome}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="m-0 text-sm text-tinta-suave">Dá para trocar depois, em Editar o site. As fotos entram quando vocês quiserem.</p>
    </fieldset>
  );
}
