// Decide se uma imagem de usuário pode passar pelo otimizador do next/image.
// Só as fotos hospedadas no nosso storage público (Supabase) entram: links externos livres e
// data URLs (ambiente local, sem storage) continuam em <img>, porque o next/image recusa hosts
// fora de `images.remotePatterns` e não otimiza data URLs.

const STORAGE_PATH = "/storage/v1/object/public/";

/** Padrão de remotePatterns derivado da URL do Supabase (vazio se não configurada). */
export function storageRemotePattern(supabaseUrl: string | undefined) {
  if (!supabaseUrl) return null;
  try {
    const url = new URL(supabaseUrl);
    if (url.protocol !== "https:") return null;
    return { protocol: "https" as const, hostname: url.hostname, pathname: `${STORAGE_PATH}**` };
  } catch {
    return null;
  }
}

/** true se `src` é uma foto do nosso storage público e, portanto, pode usar o next/image. */
export function isOptimizableImage(src: string | null | undefined, supabaseUrl: string | undefined): boolean {
  if (!src) return false;
  const pattern = storageRemotePattern(supabaseUrl);
  if (!pattern) return false;
  try {
    const url = new URL(src);
    return url.protocol === "https:" && url.hostname === pattern.hostname && url.pathname.startsWith(STORAGE_PATH);
  } catch {
    return false;
  }
}
