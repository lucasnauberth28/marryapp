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

// Caminho de imagem dos arquivos estáticos do próprio app (pasta public), ex.: /images/aceito/capa.webp.
// Só letras, números, ponto, hífen, sublinhado e barra; precisa terminar em extensão de imagem.
const OWN_IMAGE_PATH = /^\/[A-Za-z0-9][A-Za-z0-9._/-]*\.(?:avif|gif|jpe?g|png|svg|webp)$/i;

/** true para "/images/foto.webp": caminho absoluto no próprio site, sem "//", sem "..", sem esquema, sem query. */
export function isOwnStaticImagePath(value: string): boolean {
  if (!OWN_IMAGE_PATH.test(value)) return false;
  if (value.includes("//") || value.includes("..") || value.includes("/.")) return false;
  return true;
}

/**
 * Valida o endereço de uma imagem do editor do site: vazio (sem imagem), https://, data:image/
 * (ambiente local sem storage) ou um arquivo estático do próprio app (/images/...).
 * Nada de javascript:, http:, "//host" ou caminhos que sobem de pasta.
 */
export function isAllowedSiteImage(value: string): boolean {
  if (value === "") return true;
  return /^https:\/\//i.test(value) || value.startsWith("data:image/") || isOwnStaticImagePath(value);
}
