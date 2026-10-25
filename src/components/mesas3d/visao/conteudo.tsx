import { GaleriaDeCenarios } from "../scene-gallery";
import { DialogoDeCompartilhamento } from "../share-dialog";
import { AvisoSemMesas, FantasmaDoArrasto } from "./avisos";
import { CabecalhoDasMesas } from "./cabecalho";
import { CenaEm3D } from "./cena";
import { ListaDeConvidados } from "./lista-de-convidados";
import type { ReferenciasDaVisao } from "./tipos";
import { dicaDaTela, type useAcoesDaVisao } from "./use-acoes";
import type { DadosDasMesas } from "./use-dados-das-mesas";
import type { EstadoDaVisao } from "./use-estado";
import type { MesaDeEntrada } from "@/lib/mesas3d/layout";
import type { ConvidadoParaSentar } from "@/lib/mesas3d/seating";

interface Propriedades {
  edit: boolean;
  coupleNames: string;
  tables: MesaDeEntrada[];
  refs: ReferenciasDaVisao;
  estado: EstadoDaVisao;
  dados: DadosDasMesas;
  noGl: boolean;
  acoes: ReturnType<typeof useAcoesDaVisao>;
  seat: (guest: ConvidadoParaSentar, tableId: string | null) => Promise<boolean>;
}

/** A tela montada: cabeçalho, lista de convidados, cenário em 3D e as janelas de cenário e compartilhamento. */
export function ConteudoDaVisao({ edit, coupleNames, tables, refs, estado: e, dados, noGl, acoes, seat }: Propriedades) {
  return (
    <div className="flex flex-col gap-4">
      <CabecalhoDasMesas edit={edit} coupleNames={coupleNames} compartilhado={Boolean(e.shareToken)} aoTrocarCenario={() => e.setGalleryOpen(true)} aoCompartilhar={() => e.setShareOpen(true)} />

      <div className="grid min-h-0 gap-4 lg:h-[calc(100dvh-13rem)] lg:min-h-[560px] lg:grid-cols-[320px_minmax(0,1fr)]">
        <ListaDeConvidados
          edit={edit}
          estado={e}
          dados={dados}
          dragRef={refs.dragRef}
          suppressClickRef={refs.suppressClickRef}
          aoEscolher={(g) => (edit ? e.setSelectedId(e.selectedId === g.id ? null : g.id) : acoes.focusGuest(g))}
          aoSentar={(g, tableId) => void seat(g, tableId)}
        />

        <CenaEm3D
          edit={edit}
          refs={refs}
          estado={e}
          dados={dados}
          dica={dicaDaTela(edit, e.selectedId, e.guests)}
          noGl={noGl}
          acoes={acoes}
          aoTirar={(g) => void seat(g, null)}
        />
      </div>

      {tables.length === 0 && edit ? <AvisoSemMesas /> : null}
      <FantasmaDoArrasto ghostRef={refs.ghostRef} />

      <GaleriaDeCenarios open={e.galleryOpen} current={e.scene} onPick={acoes.pickScene} onClose={() => e.setGalleryOpen(false)} />
      {edit ? <DialogoDeCompartilhamento open={e.shareOpen} onClose={() => e.setShareOpen(false)} token={e.shareToken} onChange={e.setShareToken} /> : null}
    </div>
  );
}
