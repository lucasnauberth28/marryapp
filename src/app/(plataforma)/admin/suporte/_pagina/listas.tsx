import { EsqueletoDasLinhas } from "@/components/plataforma/loading-parts";
import { EsqueletoDeCartao, EsqueletoDeFormulario, RegiaoDeCarregamento } from "@/components/skeletons";
import { listarSolicitacoesDeDados, listarIncidentes, listarChamados, preenchimentoDoChamado } from "@/lib/platform/queries/chamados";
import { SolicitacoesDeDados } from "../_components/data-requests";
import { Incidentes } from "../_components/incidents";
import { RedefinicaoDeSenha } from "../_components/password-reset";
import { Chamados } from "../_components/tickets";
import { PADRAO_DE_UUID, anoMesDia, itensDeSolicitacao, linhasDeChamados, linhasDeIncidentes, resumoDosUrgentes } from "./mapeamentos";

export function EsqueletoDasListasDeSuporte() {
  return (
    <RegiaoDeCarregamento label="os pedidos de ajuda" className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-6">
        <EsqueletoDeCartao>
          <EsqueletoDasLinhas rows={4} />
        </EsqueletoDeCartao>
        <EsqueletoDeCartao>
          <EsqueletoDasLinhas rows={3} />
        </EsqueletoDeCartao>
      </div>
      <div className="flex min-w-0 flex-col gap-6">
        <EsqueletoDeCartao description>
          <EsqueletoDeFormulario fields={1} />
        </EsqueletoDeCartao>
        <EsqueletoDeCartao>
          <EsqueletoDasLinhas rows={2} />
        </EsqueletoDeCartao>
      </div>
    </RegiaoDeCarregamento>
  );
}

interface Propriedades {
  userId: string;
  showClosed: boolean;
  casal: string | undefined;
  fornecedor: string | undefined;
  openNew: boolean;
}

export async function ListasDeSuporte({ userId, showClosed, casal, fornecedor, openNew }: Propriedades) {
  const now = new Date();
  const [tickets, requests, incidents, prefill] = await Promise.all([
    listarChamados({ showClosed }),
    listarSolicitacoesDeDados(),
    listarIncidentes(),
    preenchimentoDoChamado({ weddingId: casal && PADRAO_DE_UUID.test(casal) ? casal : undefined, vendorId: fornecedor && PADRAO_DE_UUID.test(fornecedor) ? fornecedor : undefined }),
  ]);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-6">
        <Chamados
          key={`${prefill?.weddingId ?? prefill?.vendorId ?? "sem"}-${openNew ? "1" : ""}`}
          rows={linhasDeChamados(tickets, userId, now)}
          newCount={tickets.newCount}
          closedCount={tickets.closedCount}
          showClosed={showClosed}
          prefill={prefill}
          openForm={openNew}
        />
        <SolicitacoesDeDados rows={itensDeSolicitacao(requests, now)} urgent={resumoDosUrgentes(requests, now)} />
      </div>
      <div className="flex min-w-0 flex-col gap-6">
        <RedefinicaoDeSenha />
        <Incidentes today={anoMesDia(now)} rows={linhasDeIncidentes(incidents)} />
      </div>
    </div>
  );
}
