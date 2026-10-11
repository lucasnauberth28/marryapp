import "server-only";
import { connectDomain, verifyDomain, type ConnectionResult, type VercelConfig } from "@/lib/vercel-domains-core";

// Variáveis (Vercel > Settings): VERCEL_API_TOKEN, VERCEL_PROJECT_ID e, se o projeto for de um time,
// VERCEL_TEAM_ID. VERCEL_API_BASE só serve para testes locais com um servidor de mentira.
export function vercelConfigFromEnv(): VercelConfig | null {
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

export const vercelConfigured = () => vercelConfigFromEnv() !== null;

export const connectDomainToProject = (domain: string): Promise<ConnectionResult> => connectDomain(vercelConfigFromEnv(), domain);
export const verifyProjectDomain = (domain: string): Promise<ConnectionResult> => verifyDomain(vercelConfigFromEnv(), domain);
export type { ConnectionResult, DnsRecord } from "@/lib/vercel-domains-core";
