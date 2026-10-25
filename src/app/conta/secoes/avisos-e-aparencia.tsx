import { Bell, SunMoon } from "lucide-react";
import { SeletorSegmentadoDoTema } from "@/components/theme/theme-toggle";
import { FormularioDePreferencias } from "@/components/notifications/preferences-form";
import { Secao } from "./secao";
import type { Propriedades } from "./tipos";

export function SecaoDeNotificacoes({ pushPublicKey, notifications }: Pick<Propriedades, "pushPublicKey" | "notifications">) {
  return (
    <Secao id="avisos" icon={Bell} title="Avisos" description="Escolha como e quando o Aceito avisa você. O sino no topo guarda tudo, aconteça o que acontecer.">
      <FormularioDePreferencias initial={notifications.prefs} audience={notifications.audience} groups={notifications.groups} pushPublicKey={pushPublicKey} />
    </Secao>
  );
}

export function SecaoDeAparencia() {
  return (
    <Secao id="aparencia" icon={SunMoon} title="Aparência" description="Claro, escuro ou o do seu aparelho. Vale para este navegador.">
      <SeletorSegmentadoDoTema />
    </Secao>
  );
}
