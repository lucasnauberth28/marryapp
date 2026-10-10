import { redirect } from "next/navigation";
import { ScrollText } from "lucide-react";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/security/auth-guard";
import { PageHeader } from "@/components/admin/page-header";
import { Reveal } from "@/components/motion/reveal";

export const dynamic = "force-dynamic";

export const metadata = { title: "Registro de atividades" };

const LIMIT = 100;
const dateTime = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

/** Frases simples para cada ação registrada. Ações novas aparecem pelo código até ganharem frase. */
const ACTION_LABEL: Record<string, string> = {
  "subscription.confirm": "Confirmou um Pix à mão",
  "subscription.reject": "Marcou um Pix como não recebido",
  "coupon.create": "Criou um cupom",
  "coupon.update": "Alterou um cupom",
  "coupon.delete": "Excluiu um cupom",
  "vendor.approve": "Aprovou um fornecedor na curadoria",
  "vendor.reject": "Recusou um fornecedor na curadoria",
  "role.create": "Criou um perfil de acesso",
  "role.update": "Alterou um perfil de acesso",
  "role.delete": "Excluiu um perfil de acesso",
  "user.create": "Criou um usuário",
  "user.update": "Alterou um usuário",
  "user.delete": "Excluiu um usuário",
  "account.delete": "Conta excluída pelo próprio dono",
  "wedding.invite_accept": "Convite do par aceito",
  "account.password_change": "Trocou a própria senha",
  "account.password_reset": "Redefiniu a senha pelo e-mail",
  "wedding.invite_create": "Convidou o par para o casamento",
  "wedding.invite_cancel": "Cancelou um convite do par",
};

const DETAIL_LABEL: Record<string, string> = {
  code: "Código",
  name: "Nome",
  username: "Login",
  role: "Perfil",
  amount: "Valor (centavos)",
  reason: "Motivo",
  gatewayId: "Identificador",
  passwordChanged: "Senha trocada",
};

/** Resumo curto dos detalhes: só valores simples, no máximo cinco. */
function summarize(details: unknown): string {
  if (!details || typeof details !== "object" || Array.isArray(details)) return "";
  const parts: string[] = [];
  for (const [key, value] of Object.entries(details as Record<string, unknown>)) {
    const label = DETAIL_LABEL[key];
    if (!label || value === null || value === "") continue;
    if (typeof value === "boolean") parts.push(`${label}: ${value ? "sim" : "não"}`);
    else if (typeof value === "string" || typeof value === "number") parts.push(`${label}: ${value}`);
    if (parts.length === 5) break;
  }
  return parts.join(" · ");
}

const TARGET_LABEL: Record<string, string> = {
  subscription: "Assinatura",
  coupon: "Cupom",
  partner_vendor: "Fornecedor",
  role: "Perfil",
  user: "Usuário",
  User: "Usuário",
  Wedding: "Casamento",
  WeddingInvite: "Convite do par",
};

export default async function AtividadesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  // Só quem tem acesso total (administração da plataforma) lê o registro.
  if (!session.allowedPaths.includes("*")) redirect("/dashboard");

  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: LIMIT });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Administração"
        title="Registro de atividades"
        description="O que a administração fez por aqui: pagamentos, cupons, curadoria, usuários e perfis. Só leitura."
      />

      <Reveal>
        {logs.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border border-linha bg-linho p-5 text-[15px] text-tinta-suave">
            <ScrollText className="h-5 w-5 shrink-0" aria-hidden="true" />
            Nada registrado ainda. As próximas ações da administração aparecem aqui.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-linha bg-papel">
            <table className="w-full min-w-[720px] border-collapse text-[15px]">
              <caption className="sr-only">Últimas {LIMIT} atividades, da mais recente para a mais antiga</caption>
              <thead>
                <tr className="text-left text-[13px] text-tinta-suave">
                  <th scope="col" className="px-4 py-3 font-semibold">Quando</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Quem</th>
                  <th scope="col" className="px-4 py-3 font-semibold">O que fez</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const summary = summarize(log.details);
                  return (
                    <tr key={log.id} className="border-t border-linha align-top">
                      <td className="px-4 py-3.5 text-sm whitespace-nowrap text-tinta-suave">{dateTime.format(log.createdAt).replace(".", "")}</td>
                      <td className="px-4 py-3.5 text-tinta">{log.actorName ?? "Sem login"}</td>
                      <td className="px-4 py-3.5 text-tinta">
                        {ACTION_LABEL[log.action] ?? log.action}
                        {log.targetType ? (
                          <span className="block text-[13px] text-tinta-suave">{TARGET_LABEL[log.targetType] ?? log.targetType}</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5 text-sm break-words text-tinta-suave">{summary || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {logs.length === LIMIT ? <p className="mt-3 text-sm text-tinta-suave">Mostrando as {LIMIT} mais recentes.</p> : null}
      </Reveal>
    </div>
  );
}
