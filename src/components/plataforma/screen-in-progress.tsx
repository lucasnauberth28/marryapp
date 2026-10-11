import { Hammer } from "lucide-react";
import { EmptyState } from "@/components/plataforma/empty-state";
import { Panel } from "@/components/plataforma/panel";

/**
 * Marcador das telas da administração que a base criou só com título e guard: o agente da tela apaga este
 * bloco e monta o conteúdo real. Não mostra número nem dado nenhum.
 */
export function ScreenInProgress() {
  return (
    <Panel padded={false}>
      <EmptyState icon={Hammer} title="Esta tela está sendo montada">
        O menu e o acesso já funcionam. O conteúdo desta página chega em seguida.
      </EmptyState>
    </Panel>
  );
}
