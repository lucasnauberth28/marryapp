// O estado das configurações do site: edição, publicação, envio de fotos e liga/desliga das seções.
import { useState, type TransitionStartFunction } from "react";
import { toast } from "sonner";
import { atualizarPersonalizacaoDoSite, enviarImagemDoSite, type EntradaDaPersonalizacaoDoSite } from "@/actions/site-builder-actions";
import type { ConfiguracoesDoSiteDoCasamento } from "@/components/public/site-do-casamento/tipos";
import { CHAVES_EDITAVEIS, type CampoDeFoto, type ChaveDaConfiguracao } from "./tipos";

type Alteracao = Partial<ConfiguracoesDoSiteDoCasamento>;

export function useConfiguracoesDoSite(inicial: (ConfiguracoesDoSiteDoCasamento & { updatedAt?: Date | string }) | null, endereco: string, iniciar: TransitionStartFunction) {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesDoSiteDoCasamento>(inicial ?? {});
  const [alterado, setAlterado] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [publicadoEm, setPublicadoEm] = useState<string | null>(() => (inicial?.updatedAt ? new Date(inicial.updatedAt).toISOString() : null));

  const atualizar = (alteracao: Alteracao) => {
    setConfiguracoes((anterior) => ({ ...anterior, ...alteracao }));
    setAlterado(true);
  };

  const publicar = () => {
    const dados = Object.fromEntries(CHAVES_EDITAVEIS.filter((k) => configuracoes[k] !== undefined).map((k) => [k, configuracoes[k]])) as EntradaDaPersonalizacaoDoSite;
    const idDoAviso = toast.loading("Publicando as alterações...");
    setPublicando(true);
    iniciar(async () => {
      const resposta = await atualizarPersonalizacaoDoSite(dados);
      setPublicando(false);
      if (!resposta.success) return void toast.error(resposta.error || "Não deu para publicar as alterações. Tente de novo.", { id: idDoAviso });
      setAlterado(false);
      setPublicadoEm(new Date().toISOString());
      toast.success(`Alterações publicadas. O endereço para compartilhar é ${endereco}.`, { id: idDoAviso });
    });
  };

  const alternarSecao = (chave: ChaveDaConfiguracao, marcada: boolean) => {
    setConfiguracoes((anterior) => ({ ...anterior, [chave]: marcada }));
    iniciar(async () => {
      const resposta = await atualizarPersonalizacaoDoSite({ [chave]: marcada } as EntradaDaPersonalizacaoDoSite);
      if (resposta.success) return void toast.success(marcada ? "Seção exibida no site." : "Seção ocultada do site.");
      setConfiguracoes((anterior) => ({ ...anterior, [chave]: !marcada }));
      toast.error(resposta.error || "Não deu para atualizar a seção. Tente de novo.");
    });
  };

  return { configuracoes, alterado, publicando, publicadoEm, atualizar, publicar, alternarSecao };
}

export type EditorDoSite = ReturnType<typeof useConfiguracoesDoSite>;

/** Envio das fotos da capa e do casal; a foto nova só vai ao site quando as alterações são publicadas. */
export function useEnvioDeFoto(atualizar: (alteracao: Alteracao) => void, iniciar: TransitionStartFunction) {
  const [enviando, setEnviando] = useState<CampoDeFoto | null>(null);

  const enviarFoto = (campo: CampoDeFoto, arquivo: File | undefined) => {
    if (!arquivo) return;
    setEnviando(campo);
    const dados = new FormData();
    dados.append("image", arquivo);
    iniciar(async () => {
      const resposta = await enviarImagemDoSite(dados);
      setEnviando(null);
      if (resposta.success && resposta.url) {
        atualizar({ [campo]: resposta.url });
        toast.success("Foto enviada. Para ela aparecer no site, toquem em “Publicar alterações”.");
      } else toast.error(resposta.error || "Não deu para enviar a foto. Tente de novo.");
    });
  };

  return { enviando, enviarFoto };
}

export type EnvioDeFoto = ReturnType<typeof useEnvioDeFoto>;
