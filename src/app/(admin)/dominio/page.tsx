import prisma from "@/lib/prisma";
import { SUPER_ADMIN_USER_ID } from "@/lib/security/auth-guard";
import { requireWeddingPage } from "@/lib/security/wedding-context";
import { obterPedidosDeDominioDoCasamento } from "@/lib/domain-orders";
import { casamentoTemModulo } from "@/lib/wedding-plan";
import { obterIdentidadeDoCasamentoPrincipal } from "@/lib/wedding";
import { UpgradeCard } from "@/components/plan/upgrade-card";
import { DomainClient } from "./domain-client";

export const dynamic = "force-dynamic";

export const metadata = { title: "Endereço personalizado do site" };

export default async function DominioPage() {
  const { session, weddingId } = await requireWeddingPage("/dominio");

  const [{ active, lastClosed }, hasModule, identity, user] = await Promise.all([
    obterPedidosDeDominioDoCasamento(weddingId),
    casamentoTemModulo({ weddingId, session }, "customDomain"),
    obterIdentidadeDoCasamentoPrincipal(),
    session.userId === SUPER_ADMIN_USER_ID
      ? Promise.resolve(null)
      : prisma.user.findUnique({ where: { id: session.userId }, select: { name: true, username: true } }),
  ]);

  // Quem já tem pedido vê o andamento mesmo que o plano mude; sem pedido e sem o módulo, o aviso do plano que inclui o recurso
  if (!active && !hasModule) return <UpgradeCard moduleId="customDomain" />;

  return (
    <DomainClient
      coupleNames={identity.coupleNames}
      weddingDate={identity.weddingDate ? identity.weddingDate.toISOString() : null}
      order={active}
      lastClosed={active ? null : lastClosed}
      defaults={{ name: user?.name ?? "", email: user?.username.includes("@") ? user.username : "" }}
    />
  );
}
