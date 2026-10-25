import "server-only";
import { obterConfiguracaoDaPlataforma } from "@/lib/platform/settings";
import { chatDaLizEstaAtivo, type RespondedoraDaLiz } from "./answerer";

/**
 * Provedor de IA da Liz. HOJE NÃO EXISTE: nada chama a API, não há chave nem modelo configurados.
 * Para ativar (feito pela administração, nunca pelo casal):
 *   - criar aqui um LizAnswerer que chama o modelo previsto (claude-haiku-5-5) com as instruções publicadas em
 *     /admin/madrinha, a base de conhecimento (o guia de help-articles.ts pode ser a base inicial) e SÓ os dados
 *     do casamento da sessão;
 *   - respeitar os limites de /admin/madrinha (por dia, por mês, teto de custo, bloqueio por abuso);
 *   - devolver LizAnswer { kind: "text", ... } e nunca executar ação por conta própria: o casal aprova.
 */
export function obterProvedorDaLiz(): RespondedoraDaLiz | null {
  return null;
}

/** Lê o interruptor geral e confere se há provedor. Fica falso enquanto a IA não estiver conectada. */
export async function lerSeOChatDaLizEstaAtivo(): Promise<boolean> {
  const master = await obterConfiguracaoDaPlataforma("madrinha.master");
  return chatDaLizEstaAtivo(master, obterProvedorDaLiz());
}
