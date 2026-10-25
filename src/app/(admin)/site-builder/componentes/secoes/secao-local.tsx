import { Entrada } from "@/components/ui/input";
import { InterruptorDeVisibilidade } from "../interruptor-de-visibilidade";
import type { ChaveDaConfiguracao } from "../tipos";
import type { EditorDoSite } from "../use-configuracoes-do-site";

export function SecaoDoLocal({ chave, site }: { chave: ChaveDaConfiguracao; site: EditorDoSite }) {
  const { configuracoes: c, atualizar } = site;
  return (
    <>
      <InterruptorDeVisibilidade chave={chave} site={site} />
      <p className="text-sm text-tinta-suave">Se vocês não informarem os links de rota, o site cria os botões a partir do endereço.</p>
      <Entrada id="locationName" label="Nome do local" value={c.locationName || ""} onChange={(e) => atualizar({ locationName: e.target.value })} />
      <Entrada id="locationAddress" label="Endereço completo" value={c.locationAddress || ""} onChange={(e) => atualizar({ locationAddress: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <Entrada id="ceremonyTime" label="Horário da cerimônia" type="time" value={c.ceremonyTime || ""} onChange={(e) => atualizar({ ceremonyTime: e.target.value })} />
        <Entrada id="receptionTime" label="Horário da recepção" type="time" value={c.receptionTime || ""} onChange={(e) => atualizar({ receptionTime: e.target.value })} />
      </div>
      <Entrada id="locationMapUrl" label="Link do Google Maps" optional value={c.locationMapUrl || ""} onChange={(e) => atualizar({ locationMapUrl: e.target.value })} placeholder="https://maps.app.goo.gl/..." />
      <Entrada id="wazeUrl" label="Link do Waze" optional value={c.wazeUrl || ""} onChange={(e) => atualizar({ wazeUrl: e.target.value })} placeholder="https://waze.com/ul/..." />
      <Entrada id="uberUrl" label="Link do Uber" optional value={c.uberUrl || ""} onChange={(e) => atualizar({ uberUrl: e.target.value })} placeholder="https://m.uber.com/ul/..." />
    </>
  );
}
