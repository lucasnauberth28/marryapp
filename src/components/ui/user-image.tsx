import Image from "next/image";
import { isOptimizableImage } from "@/lib/image-source";

interface UserImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Largura renderizada, para o navegador escolher o tamanho certo (ex.: "(min-width: 768px) 50vw, 100vw"). */
  sizes: string;
  /** Imagem acima da dobra (LCP): carrega já e sem lazy. */
  priority?: boolean;
}

/**
 * Foto enviada por usuário (casal, fornecedor). Preenche o pai, que precisa ser `relative` e ter tamanho.
 * Fotos do nosso storage passam pelo next/image (WebP/AVIF e tamanhos responsivos); links livres e
 * data URLs seguem como <img> comum, pois o domínio é desconhecido ou não há o que otimizar.
 */
export function UserImage({ src, alt, className, sizes, priority }: UserImageProps) {
  if (isOptimizableImage(src, process.env.NEXT_PUBLIC_SUPABASE_URL)) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- origem desconhecida (link livre) ou data URL: o next/image recusaria
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={`absolute inset-0 h-full w-full ${className ?? ""}`}
    />
  );
}
