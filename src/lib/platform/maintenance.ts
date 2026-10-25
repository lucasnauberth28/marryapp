import "server-only";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { interpretarConfiguracao } from "@/lib/platform/settings-schema";
import { recusaPorManutencao, type SituacaoDaManutencao } from "@/lib/platform/maintenance-core";

/**
 * Modo de manutenção, aplicado de verdade:
 *  - o painel do casal fica só para leitura (requireWedding recusa escrita com o texto de maintenanceRefusal);
 *  - o painel do casal mostra uma faixa, e o site público do casamento mostra um aviso aos convidados
 *    (via /api/manutencao, para as páginas estáticas também verem a mudança);
 *  - NUNCA bloqueia o /admin, os webhooks nem as rotinas (nada disso chama este código).
 * A leitura tem cache curto de 30 s (tag "maintenance", limpa na hora quando a administração salva) e, se o banco
 * falhar, o modo fica desligado: uma falha de leitura nunca derruba o painel.
 */
export const ETIQUETA_DA_MANUTENCAO = "maintenance";

export const obterManutencao = unstable_cache(
  async (): Promise<SituacaoDaManutencao> => {
    try {
      const row = await prisma.platformSetting.findUnique({ where: { key: "maintenance" }, select: { value: true } });
      return interpretarConfiguracao("maintenance", row?.value);
    } catch (error) {
      console.error("[manutencao] leitura:", error instanceof Error ? error.message : error);
      return interpretarConfiguracao("maintenance", null);
    }
  },
  ["platform-maintenance-v1"],
  { revalidate: 30, tags: [ETIQUETA_DA_MANUTENCAO] },
);

/** Recusa de escrita do painel do casal durante a manutenção (null = liberado ou conta da administração). */
export async function recusaDeEscritaPorManutencao(allowedPaths: readonly string[]): Promise<string | null> {
  return recusaPorManutencao(await obterManutencao(), allowedPaths);
}
