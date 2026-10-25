import "server-only";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { DEFINICOES_DE_CONFIGURACAO, interpretarConfiguracao, type ChaveDeConfiguracao, type ValorDeConfiguracao } from "@/lib/platform/settings-schema";

/**
 * Configurações da plataforma e da Liz (tabela platform_settings), com formato validado por zod
 * (settings-schema.ts) e padrão do código quando não há linha.
 *
 *  - getPlatformSetting(key)        leitura (qualquer lugar do servidor, inclusive páginas públicas: ex. manutenção).
 *  - savePlatformSetting(key, v)    escrita só da administração: valida, grava e registra no AuditLog
 *                                   ("platform_setting.update", com o valor antes e depois). Lança AuthorizationError
 *                                   sem acesso e ZodError com valor inválido: a Server Action trata os dois.
 *
 * Quem lê em caminho quente (a cada visita) deve guardar o resultado em cache curto: a leitura vai ao banco.
 */

export async function obterConfiguracaoDaPlataforma<K extends ChaveDeConfiguracao>(key: K): Promise<ValorDeConfiguracao<K>> {
  try {
    const row = await prisma.platformSetting.findUnique({ where: { key }, select: { value: true } });
    return interpretarConfiguracao(key, row?.value);
  } catch (error) {
    console.error("[getPlatformSetting]", key, error instanceof Error ? error.message : error);
    return interpretarConfiguracao(key, null);
  }
}

export async function salvarConfiguracaoDaPlataforma<K extends ChaveDeConfiguracao>(key: K, value: ValorDeConfiguracao<K>, note?: string): Promise<ValorDeConfiguracao<K>> {
  const admin = await exigirAdminDaPlataforma();
  const clean = DEFINICOES_DE_CONFIGURACAO[key].schema.parse(value) as ValorDeConfiguracao<K>;
  const before = await obterConfiguracaoDaPlataforma(key);
  await prisma.platformSetting.upsert({
    where: { key },
    create: { key, value: clean as Prisma.InputJsonValue, updatedById: admin.userId, updatedByName: admin.name ?? "Administrador" },
    update: { value: clean as Prisma.InputJsonValue, updatedById: admin.userId, updatedByName: admin.name ?? "Administrador" },
  });
  await registrarAuditoria({
    action: "platform_setting.update",
    targetType: "platform_setting",
    targetId: key,
    details: { before: before as Prisma.InputJsonValue, after: clean as Prisma.InputJsonValue, ...(note ? { note: note.slice(0, 300) } : {}) },
  });
  return clean;
}
