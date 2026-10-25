import { CaixaDeSelecao } from "@/components/ui/checkbox";
import { Rotulo } from "@/components/ui/label";
import { MOTIVO_DO_WHATSAPP_DESLIGADO, ROTULO_DO_CANAL, type Canal } from "@/lib/platform/announcement-audience";

function CanalDoWhatsappDesligado() {
  return (
    <div className="flex min-h-11 items-start gap-3 rounded-xl py-2">
      <CaixaDeSelecao id="canal-WHATSAPP" checked={false} disabled className="mt-0.5" />
      <div className="min-w-0">
        <Rotulo htmlFor="canal-WHATSAPP" className="text-base">
          {ROTULO_DO_CANAL.WHATSAPP}
        </Rotulo>
        <p className="text-sm leading-5 text-tinta-suave">{MOTIVO_DO_WHATSAPP_DESLIGADO}</p>
      </div>
    </div>
  );
}

interface Propriedades {
  channels: Canal[];
  emailConfigured: boolean;
  error?: string;
  aoAlternar: (canal: Canal, ligado: boolean) => void;
}

export function SecaoCanais({ channels, emailConfigured, error, aoAlternar }: Propriedades) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-base font-semibold text-tinta">Por onde avisar</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(["PANEL", "PUSH", "EMAIL"] as const).map((c) => (
          <div key={c} className="flex min-h-11 items-start gap-3 rounded-xl py-2">
            <CaixaDeSelecao id={`canal-${c}`} checked={channels.includes(c)} onCheckedChange={(v) => aoAlternar(c, v === true)} className="mt-0.5" />
            <div className="min-w-0">
              <Rotulo htmlFor={`canal-${c}`} className="text-base">
                {ROTULO_DO_CANAL[c]}
              </Rotulo>
              {c === "EMAIL" && !emailConfigured && <p className="text-sm leading-5 text-aviso">O e-mail não está configurado no servidor.</p>}
              {c === "PUSH" && <p className="text-sm leading-5 text-tinta-suave">Só para quem ativou os avisos no celular.</p>}
            </div>
          </div>
        ))}
        <CanalDoWhatsappDesligado />
      </div>
      {error && (
        <p role="alert" className="text-sm font-semibold text-perigo">
          {error}
        </p>
      )}
    </fieldset>
  );
}
