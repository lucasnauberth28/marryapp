// Aplica as migrations do Prisma no deploy de PRODUÇÃO da Vercel, antes do `next build`.
// - Previews (branches) e builds locais não tocam no banco.
// - Se a migration falhar, o build falha e a versão anterior continua no ar.
// - Usa DIRECT_URL (prisma.config.ts): no Supabase, a conexão "Session pooler", porta 5432.
import { execSync } from "node:child_process";

const env = process.env.VERCEL_ENV;

if (env !== "production") {
  console.log(`[migrate-on-deploy] Migrations ignoradas (VERCEL_ENV=${env ?? "local"}).`);
  process.exit(0);
}

if (!process.env.DIRECT_URL) {
  console.error("[migrate-on-deploy] DIRECT_URL não configurada na Vercel: não dá para aplicar as migrations.");
  process.exit(1);
}

if (/:6543\//.test(process.env.DIRECT_URL)) {
  console.error(
    "[migrate-on-deploy] DIRECT_URL aponta para a porta 6543 (Transaction pooler), que não suporta migrations. " +
      "Use a string do Session pooler do Supabase (porta 5432).",
  );
  process.exit(1);
}

console.log("[migrate-on-deploy] Aplicando migrations pendentes no banco de produção…");
execSync("npx prisma migrate deploy", { stdio: "inherit" });
