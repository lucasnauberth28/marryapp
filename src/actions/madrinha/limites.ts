"use server";

// Administração da Liz: limites de uso, teto global, proteção contra abuso e capacidades.
import { z } from "zod";
import { falhaDeAdminDaPlataforma, exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { salvarConfiguracaoDaPlataforma } from "@/lib/platform/settings";
import { interpretarCampoInteiro, interpretarLimitesDoPlano, interpretarReaisEmCentavos, type ErrosDosCampos, type FormularioDeLimitesDoPlano } from "@/lib/platform/madrinha";
import { type Falha, type Sucesso, atualizarPaginas, falhaDeCampo, formatoDosLimitesDoPlano } from "@/actions/madrinha/comum";

export async function salvarLimitesDaMadrinha(input: unknown): Promise<Sucesso | Falha> {
  try {
    await exigirAdminDaPlataforma();
    const data = z.object({ subscription: formatoDosLimitesDoPlano, trial: formatoDosLimitesDoPlano }).parse(input);
    const sub = interpretarLimitesDoPlano(data.subscription as FormularioDeLimitesDoPlano);
    const trial = interpretarLimitesDoPlano(data.trial as FormularioDeLimitesDoPlano);
    if (!sub.ok || !trial.ok) {
      return falhaDeCampo({
        ...Object.fromEntries(Object.entries(sub.ok ? {} : sub.errors).map(([k, v]) => [`subscription.${k}`, v])),
        ...Object.fromEntries(Object.entries(trial.ok ? {} : trial.errors).map(([k, v]) => [`trial.${k}`, v])),
      });
    }
    await salvarConfiguracaoDaPlataforma("madrinha.limits", { subscription: sub.value, trial: trial.value });
    atualizarPaginas();
    return { success: true, message: "Limites salvos. Valem quando a Liz for ativada." };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "saveMadrinhaLimits");
  }
}

export async function salvarTetoGlobalDaMadrinha(input: unknown): Promise<Sucesso | Falha> {
  try {
    await exigirAdminDaPlataforma();
    const data = z.object({ monthlyCostCap: z.string().max(16), warnPercent: z.string().max(4), pauseAtCap: z.boolean() }).parse(input);
    const cap = interpretarReaisEmCentavos(data.monthlyCostCap);
    const warn = interpretarCampoInteiro(data.warnPercent);
    const errors: ErrosDosCampos<"monthlyCostCap" | "warnPercent"> = {};
    if (cap === null || cap > 100_000_00) errors.monthlyCostCap = "Use um valor em reais, como 300,00.";
    if (warn === null || warn > 100) errors.warnPercent = "Use de 0 a 100.";
    if (cap === null || warn === null || Object.keys(errors).length) return falhaDeCampo(errors);
    await salvarConfiguracaoDaPlataforma("madrinha.globalCap", { monthlyCostCapCents: cap, warnPercent: warn, pauseAtCap: data.pauseAtCap });
    atualizarPaginas();
    return { success: true, message: "Teto mensal salvo." };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "saveMadrinhaGlobalCap");
  }
}

export async function salvarLimitesContraAbusoDaMadrinha(input: unknown): Promise<Sucesso | Falha> {
  try {
    await exigirAdminDaPlataforma();
    const data = z
      .object({ perHour: z.string().max(12), blockHours: z.string().max(6), blockOffTopic: z.boolean(), offTopicBeforeBlock: z.string().max(6) })
      .parse(input);
    const perHour = interpretarCampoInteiro(data.perHour);
    const blockHours = interpretarCampoInteiro(data.blockHours);
    const before = interpretarCampoInteiro(data.offTopicBeforeBlock);
    const errors: ErrosDosCampos<"perHour" | "blockHours" | "offTopicBeforeBlock"> = {};
    if (perHour === null || perHour > 1_000) errors.perHour = "Use um número inteiro, até 1.000.";
    if (blockHours === null || blockHours < 1 || blockHours > 720) errors.blockHours = "Use de 1 a 720 horas.";
    if (before === null || before < 1 || before > 100) errors.offTopicBeforeBlock = "Use de 1 a 100 recusas.";
    if (perHour === null || blockHours === null || before === null || Object.keys(errors).length) return falhaDeCampo(errors);
    await salvarConfiguracaoDaPlataforma("madrinha.abuse", { perHour, blockHours, blockOffTopic: data.blockOffTopic, offTopicBeforeBlock: before });
    atualizarPaginas();
    return { success: true, message: "Bloqueio por abuso salvo." };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "saveMadrinhaAbuse");
  }
}

/** "Enviar mensagens sozinha" não existe no formato: a Liz nunca envia sozinha. `.strict()` recusa qualquer campo a mais. */
export async function salvarCapacidadesDaMadrinha(input: unknown): Promise<Sucesso | Falha> {
  try {
    await exigirAdminDaPlataforma();
    const data = z
      .object({ draftReminder: z.boolean(), suggestTasks: z.boolean(), buildTimeline: z.boolean(), compareQuotes: z.boolean() })
      .strict()
      .parse(input);
    await salvarConfiguracaoDaPlataforma("madrinha.capabilities", data);
    atualizarPaginas();
    return { success: true, message: "Salvo." };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "saveMadrinhaCapabilities");
  }
}
