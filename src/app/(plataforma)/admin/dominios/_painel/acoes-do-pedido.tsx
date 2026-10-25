import { Link2, RefreshCw } from "lucide-react";
import { conectarDominioAcao, marcarDominioComoRenovado, verificarDominioAcao } from "@/actions/dominio-admin/conexao";
import { iniciarRegistroDoDominio } from "@/actions/dominio-admin/registro";
import { Botao } from "@/components/ui/button";
import type { PainelDoDominioEstado } from "./use-painel-do-dominio";
import type { DadosDoPainelDoDominio } from "./tipos-e-textos";

/** Os botões de cada situação do pedido (as ações são auditadas no servidor). */
export function AcoesDoPedido({ order, vercelReady, estado }: { order: DadosDoPainelDoDominio; vercelReady: boolean; estado: PainelDoDominioEstado }) {
  const { pending, panel, setPanel, run, carregando } = estado;
  const id = order.id;
  return (
    <>
      {order.status === "REQUESTED" ? (
        <div className="flex flex-wrap gap-2">
          <Botao type="button" disabled={pending} loading={carregando("start")} onClick={() => run("start", () => iniciarRegistroDoDominio(id))}>
            Começar o registro
          </Botao>
        </div>
      ) : null}
      {order.status === "REGISTERING" ? (
        <div className="flex flex-wrap gap-2">
          <Botao type="button" disabled={pending} onClick={() => setPanel(panel === "registered" ? null : "registered")}>
            Marcar como registrado
          </Botao>
        </div>
      ) : null}
      {order.status === "REGISTERED" ? (
        <div className="flex flex-wrap gap-2">
          <Botao type="button" disabled={pending || !vercelReady} loading={carregando("connect")} onClick={() => run("connect", () => conectarDominioAcao(id))}>
            <Link2 className="size-4" aria-hidden="true" /> Conectar à Vercel
          </Botao>
          <Botao type="button" variant="outline" disabled={pending || !vercelReady} loading={carregando("verify")} onClick={() => run("verify", () => verificarDominioAcao(id))}>
            <RefreshCw className="size-4" aria-hidden="true" /> Verificar DNS
          </Botao>
          <Botao type="button" variant="outline" disabled={pending} onClick={() => setPanel(panel === "online" ? null : "online")}>
            Marcar como no ar
          </Botao>
        </div>
      ) : null}
      {order.canRenew ? (
        <div>
          <Botao type="button" variant="outline" disabled={pending} loading={carregando("renew")} onClick={() => run("renew", () => marcarDominioComoRenovado(id))}>
            Marcar como renovado (mais 1 ano)
          </Botao>
          <p className="mt-1 text-xs text-tinta-suave">Use depois de renovar no Registro.br. O vencimento sobe 1 ano e os avisos de 60 e 30 dias voltam a valer.</p>
        </div>
      ) : null}
    </>
  );
}
