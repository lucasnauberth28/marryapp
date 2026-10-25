"use client";

import { Building2, ImagePlus } from "lucide-react";
import { Aparicao } from "@/components/motion/reveal";
import type { MidiasDoFornecedor } from "@/actions/fornecedor/midias";
import { cn } from "@/lib/utils";
import { Galeria } from "./_perfil/galeria";
import { BlocoDeImagem } from "./_perfil/bloco-de-imagem";
import { LADO_MAXIMO } from "./_perfil/comprimir-imagem";
import { ESTILO_DA_DICA, ESTILO_DO_CARTAO } from "./_perfil/estilos";
import { useMidias } from "./_perfil/use-midias";

export function FormularioDeMidias({ initial }: { initial: MidiasDoFornecedor }) {
  const m = useMidias(initial);
  const ocupado = m.busy !== null;
  return (
    <Aparicao variant="up" delay={200}>
      <section aria-labelledby="fotos-titulo" className={cn(ESTILO_DO_CARTAO, "flex flex-col gap-6")}>
        <div className="flex flex-col gap-1">
          <h2 id="fotos-titulo" className="text-xl leading-7 font-semibold">
            Portfólio
          </h2>
          <p className={ESTILO_DA_DICA}>As fotos são salvas na hora. Reduzimos cada imagem para até {LADO_MAXIMO} px antes de enviar (JPG, PNG ou WEBP, até 5 MB).</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[auto_minmax(0,1fr)]">
          <BlocoDeImagem
            titulo="Logo"
            url={m.media.logoUrl}
            alt="Logo atual"
            icone={<Building2 aria-hidden="true" className="size-10 text-tinta-suave" />}
            caixa="size-28"
            enviando={m.busy === "logo"}
            ocupado={ocupado}
            rotuloDeEnviar="Enviar"
            rotuloDeTrocar="Trocar"
            complementoDoBotao="logo"
            rotuloDeRemover="Remover logo"
            aoEscolher={m.aoEscolher("logo")}
            aoRemover={() => m.run("logo-remove", async () => ({ action: "remove-logo" }), "Logo removido.")}
          />
          <BlocoDeImagem
            titulo="Capa"
            className="min-w-0"
            url={m.media.coverUrl}
            alt="Capa atual"
            icone={<ImagePlus aria-hidden="true" className="size-10 text-tinta-suave" />}
            caixa="aspect-[16/7] w-full"
            enviando={m.busy === "cover"}
            ocupado={ocupado}
            rotuloDeEnviar="Enviar capa"
            rotuloDeTrocar="Trocar capa"
            rotuloDeRemover="Remover capa"
            dica="Aparece no card da lista de fornecedores. Prefira uma foto horizontal."
            aoEscolher={m.aoEscolher("cover")}
            aoRemover={() => m.run("cover-remove", async () => ({ action: "remove-cover" }), "Capa removida.")}
          />
        </div>
        <Galeria m={m} />
      </section>
    </Aparicao>
  );
}
