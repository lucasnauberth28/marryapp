import prisma from "@/lib/prisma";
import { ID_DO_SUPER_ADMIN } from "@/lib/security/auth-guard";
import { exigirCasamentoNaPagina } from "@/lib/security/wedding-context";
import { obterPedidosDeDominioDoCasamento } from "@/lib/dominio/domain-orders";
import { casamentoTemModulo } from "@/lib/casamento/wedding-plan";
import { obterIdentidadeDoCasamentoPrincipal } from "@/lib/casamento/wedding";
import { CartaoDeUpgrade } from "@/components/plan/upgrade-card";
import { DominioCliente } from "./dominio-cliente";

export const dynamic = "force-dynamic";

export const metadata = { title: "Endereço personalizado do site" };

export default async function DominioPage() {
  const { session, weddingId } = await exigirCasamentoNaPagina("/dominio");

  const [{ active, lastClosed }, hasModule, identity, user] = await Promise.all([
    obterPedidosDeDominioDoCasamento(weddingId),
    casamentoTemModulo({ weddingId, session }, "customDomain"),
    obterIdentidadeDoCasamentoPrincipal(),
    session.userId === ID_DO_SUPER_ADMIN
      ? Promise.resolve(null)
      : prisma.user.findUnique({ where: { id: session.userId }, select: { name: true, username: true } }),
  ]);

  // Quem já tem pedido vê o andamento mesmo que o plano mude; sem pedido e sem o módulo, o aviso do plano que inclui o recurso
  if (!active && !hasModule) return <CartaoDeUpgrade moduleId="customDomain" />;

  return (
    <DominioCliente
      coupleNames={identity.coupleNames}
      weddingDate={identity.weddingDate ? identity.weddingDate.toISOString() : null}
      order={active}
      lastClosed={active ? null : lastClosed}
      defaults={{ name: user?.name ?? "", email: user?.username.includes("@") ? user.username : "" }}
    />
  );
}
