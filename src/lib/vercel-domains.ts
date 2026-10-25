import "server-only";
import { conectarDominio, verificarDominio, type ResultadoDaConexao, type ConfiguracaoDaVercel } from "@/lib/vercel-domains-core";

// Variáveis (Vercel > Settings): VERCEL_API_TOKEN, VERCEL_PROJECT_ID e, se o projeto for de um time,
// VERCEL_TEAM_ID. VERCEL_API_BASE só serve para testes locais com um servidor de mentira.
function configuracaoDaVercelDoAmbiente(): ConfiguracaoDaVercel | null {
  const token = process.env.VERCEL_API_TOKEN?.trim();
  const projectId = process.env.VERCEL_PROJECT_ID?.trim();
  if (!token || !projectId) return null;
  return {
    token,
    projectId,
    teamId: process.env.VERCEL_TEAM_ID?.trim() || undefined,
    base: process.env.VERCEL_API_BASE?.trim() || undefined,
  };
}

export const vercelEstaConfigurada = () => configuracaoDaVercelDoAmbiente() !== null;

export const conectarDominioAoProjeto = (domain: string): Promise<ResultadoDaConexao> => conectarDominio(configuracaoDaVercelDoAmbiente(), domain);
export const verificarDominioDoProjeto = (domain: string): Promise<ResultadoDaConexao> => verificarDominio(configuracaoDaVercelDoAmbiente(), domain);
export type { ResultadoDaConexao, RegistroDns } from "@/lib/vercel-domains-core";
