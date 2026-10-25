// A galeria do site: envio de várias fotos, remoção e troca de ordem. A lista vai ao site com "Publicar alterações".
import { useState, type TransitionStartFunction } from "react";
import { toast } from "sonner";
import { enviarImagemDoSite } from "@/actions/site/personalizacao";
import { MAXIMO_DE_FOTOS_DA_GALERIA, fotosDaGaleria, textoDaGaleria } from "@/components/public/site-do-casamento/modelos/catalogo";
import type { EditorDoSite } from "./use-configuracoes-do-site";

export function useGaleria(site: EditorDoSite, iniciar: TransitionStartFunction) {
  const [enviando, setEnviando] = useState(false);
  const fotos = fotosDaGaleria(site.configuracoes.galleryUrls);

  const gravar = (lista: string[]) => site.atualizar({ galleryUrls: textoDaGaleria(lista) });

  const adicionar = (arquivos: FileList | null) => {
    const escolhidos = Array.from(arquivos ?? []).slice(0, MAXIMO_DE_FOTOS_DA_GALERIA - fotos.length);
    if (escolhidos.length === 0) return;
    setEnviando(true);
    iniciar(async () => {
      const urls: string[] = [];
      for (const arquivo of escolhidos) {
        const dados = new FormData();
        dados.append("image", arquivo);
        const resposta = await enviarImagemDoSite(dados);
        if (resposta.success && resposta.url) urls.push(resposta.url);
        else toast.error(resposta.error || "Não deu para enviar uma das fotos. Tente de novo.");
      }
      setEnviando(false);
      if (urls.length > 0) {
        gravar([...fotos, ...urls]);
        toast.success("Fotos enviadas. Para aparecerem no site, toquem em “Publicar alterações”.");
      }
    });
  };

  const remover = (indice: number) => gravar(fotos.filter((_, i) => i !== indice));

  const mover = (indice: number, passo: -1 | 1) => {
    const destino = indice + passo;
    if (destino < 0 || destino >= fotos.length) return;
    const lista = [...fotos];
    [lista[indice], lista[destino]] = [lista[destino], lista[indice]];
    gravar(lista);
  };

  return { fotos, enviando, cheia: fotos.length >= MAXIMO_DE_FOTOS_DA_GALERIA, adicionar, remover, mover };
}
