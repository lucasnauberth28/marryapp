export const LADO_MAXIMO = 1600;
export const LADO_MAXIMO_DO_LOGOTIPO = 800;
export const TIPOS_ACEITOS = "image/jpeg,image/png,image/webp,image/avif";
const TAMANHO_MAXIMO_DA_DATA_URL = Math.floor(5 * 1024 * 1024 * 1.33); // ~5 MB depois do base64

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("decode"));
    img.src = src;
  });
}

/** Tenta WebP; sem WebP no navegador, JPEG sobre fundo branco (JPEG não tem transparência). */
function codificar(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, quality: number) {
  const webp = canvas.toDataURL("image/webp", quality);
  if (webp.startsWith("data:image/webp")) return webp;
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "source-over";
  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Redimensiona no navegador (lado maior até `maxSide`) e comprime em WebP
 * (ou JPEG, se o navegador não gerar WebP). Assim cada envio fica com poucas centenas de KB.
 */
export async function comprimirImagem(file: File, maxSide: number): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("type");
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await carregarImagem(objectUrl);
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.75, 0.6]) {
      const out = codificar(canvas, ctx, quality);
      if (out.length <= TAMANHO_MAXIMO_DA_DATA_URL) return out;
    }
    throw new Error("size");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function erroDeCompressao(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "type") return "Escolha um arquivo de imagem (JPG, PNG ou WEBP).";
  if (code === "size") return "A imagem ficou grande demais mesmo comprimida. Tente outra foto.";
  return "Não foi possível ler esta imagem. Tente uma foto em JPG ou PNG.";
}
