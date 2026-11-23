"use server";

// Administração da Liz: ligar e desligar para os casais, e pausar para todos (o botão de emergência).
import { z } from "zod";
import { falhaDeAdminDaPlataforma, exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { obterConfiguracaoDaPlataforma, salvarConfiguracaoDaPlataforma } from "@/lib/platform/settings";
import { type Falha, type Sucesso, atualizarPaginas } from "@/actions/madrinha/comum";

export async function definirSeALizEstaLigada(input: unknown): Promise<Sucesso | Falha> {
  try {
    await exigirAdminDaPlataforma();
    const { ligada } = z.object({ ligada: z.boolean() }).parse(input);
    if (ligada && !process.env.GEMINI_API_KEY) {
      return { success: false, error: "Falta a chave do Gemini no servidor (GEMINI_API_KEY). Configure na Vercel e tente de novo." };
    }
    const atual = await obterConfiguracaoDaPlataforma("madrinha.master");
    await salvarConfiguracaoDaPlataforma("madrinha.master", { ...atual, enabled: ligada, pausedAt: ligada ? null : atual.pausedAt, pausedReason: ligada ? null : atual.pausedReason });
    atualizarPaginas();
    return { success: true, message: ligada ? "A Liz está ligada para os casais." : "A Liz foi desligada. Os casais voltam a usar só o guia de ajuda." };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "setMadrinhaEnabled");
  }
}

/** "Pausar para todos" e "Retomar". Pausada, a Liz responde só pelo guia de ajuda, sem apagar nada. */
export async function pausarOuRetomarALiz(input: unknown): Promise<Sucesso | Falha> {
  try {
    await exigirAdminDaPlataforma();
    const { pausar, motivo } = z.object({ pausar: z.boolean(), motivo: z.string().trim().max(300).optional() }).parse(input);
    const atual = await obterConfiguracaoDaPlataforma("madrinha.master");
    await salvarConfiguracaoDaPlataforma("madrinha.master", { ...atual, pausedAt: pausar ? new Date().toISOString() : null, pausedReason: pausar ? motivo || null : null });
    atualizarPaginas();
    return { success: true, message: pausar ? "A Liz foi pausada para todos." : "A Liz foi retomada." };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "pauseMadrinha");
  }
}
