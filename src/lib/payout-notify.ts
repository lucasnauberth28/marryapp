import "server-only";
import prisma from "@/lib/prisma";
import { brandedEmail, sendEmail } from "@/lib/email";
import { appUrl } from "@/lib/app-url";
import { deferNotify } from "@/lib/notifications/service";

export type PayoutChange = "created" | "updated" | "removed";

const SUBJECT: Record<PayoutChange, string> = {
  created: "Dados de recebimento cadastrados no Aceito",
  updated: "Os dados de recebimento foram alterados",
  removed: "Os dados de recebimento foram removidos",
};

const SENTENCE: Record<PayoutChange, string> = {
  created: "foram cadastrados",
  updated: "foram alterados",
  removed: "foram removidos",
};

/**
 * Avisa todas as pessoas do casamento (sino do painel e e-mail) que os dados de recebimento mudaram.
 * O texto NUNCA leva o dado: só quem fez a mudança e o que aconteceu. Roda depois da resposta e nunca lança erro.
 */
export function notifyPayoutChange(params: { weddingId: string; actorName: string; change: PayoutChange; at: Date }) {
  deferNotify(async () => {
    const members = await prisma.user.findMany({ where: { weddingId: params.weddingId }, select: { id: true, username: true } });
    if (members.length === 0) return;

    const who = params.actorName.split(/\s+/)[0] || "Alguém do casal";
    const title = SUBJECT[params.change];
    const body = `Os dados de recebimento dos presentes ${SENTENCE[params.change]} por ${who}. Se não foi você ou seu par, fale com o suporte do Aceito.`;

    await prisma.notification.createMany({
      data: members.map((m) => ({
        userId: m.id,
        type: "payout_changed",
        title,
        body,
        href: "/configuracoes/recebimento",
        weddingId: params.weddingId,
        dedupeKey: `payout_changed:${params.weddingId}:${params.at.getTime()}`,
      })),
      skipDuplicates: true,
    });

    const { html, text } = brandedEmail({
      heading: title,
      paragraphs: [
        `Os dados de recebimento dos presentes do casamento ${SENTENCE[params.change]} por ${who}.`,
        "Por segurança, não mostramos os dados neste e-mail. Para conferir, abra o painel.",
      ],
      cta: { label: "Ver onde receber os presentes", url: appUrl("/configuracoes/recebimento") },
      footnotes: ["Se vocês não reconhecem essa mudança, troquem a senha em Minha conta e fale com o suporte do Aceito."],
      preheader: "Por segurança, o e-mail não mostra os dados.",
    });
    await Promise.all(
      members
        .filter((m) => m.username.includes("@"))
        .map((m) => sendEmail({ to: m.username, subject: title, html, text }).catch(() => undefined)),
    );
  });
}
