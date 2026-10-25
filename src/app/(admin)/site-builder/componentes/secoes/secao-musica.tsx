import { Entrada } from "@/components/ui/input";
import { InterruptorDeVisibilidade } from "../interruptor-de-visibilidade";
import type { ChaveDaConfiguracao } from "../tipos";
import type { EditorDoSite } from "../use-configuracoes-do-site";

export function SecaoDaMusica({ chave, descricao, site }: { chave: ChaveDaConfiguracao; descricao?: string; site: EditorDoSite }) {
  return (
    <>
      <InterruptorDeVisibilidade chave={chave} descricao={descricao} site={site} />
      <Entrada id="spotifyPlaylistUrl" label="Link da playlist" value={site.configuracoes.spotifyPlaylistUrl || ""} onChange={(e) => site.atualizar({ spotifyPlaylistUrl: e.target.value })} placeholder="https://open.spotify.com/playlist/..." />
    </>
  );
}
