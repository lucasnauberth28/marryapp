// Prévia: como a mensagem chega no WhatsApp (balão, anexo e links).
import { Image as ImageIcon, MessageCircle } from "lucide-react";

interface PreviaDoWhatsappProps {
  coupleNames: string;
  text: string;
  sampleName: string;
  links: { text: string; url: string }[];
  hasMedia: boolean;
  mediaType: string;
}

const ROTULO_DO_ANEXO: Record<string, string> = { image: "Imagem anexada", document: "Documento anexado" };

export function PreviaDoWhatsapp({ coupleNames, text, sampleName, links, hasMedia, mediaType }: PreviaDoWhatsappProps) {
  const corpo = (text || "O texto da mensagem aparece aqui enquanto vocês escrevem.").replace(/\{nome\}/gi, sampleName);
  return (
    <div className="flex flex-col gap-2 rounded-3xl bg-areia p-4">
      <div className="flex items-center gap-2 pb-1 text-sm font-semibold text-tinta">
        <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{coupleNames}</span>
      </div>
      <div className="max-w-[94%] self-start rounded-[4px_16px_16px_16px] bg-papel px-3 py-2.5 text-sm leading-5 text-tinta shadow-[var(--shadow-aceito-1)]">
        {hasMedia ? (
          <p className="mb-2 flex items-center gap-2 rounded-lg bg-areia px-3 py-2.5 text-tinta-suave">
            <ImageIcon className="size-4 shrink-0" aria-hidden="true" />
            {ROTULO_DO_ANEXO[mediaType] ?? "Áudio anexado"}
          </p>
        ) : null}
        <p className="whitespace-pre-wrap break-words">{corpo}</p>
        {links.length > 0 ? (
          <div className="mt-2 flex flex-col gap-1.5 border-t border-linha pt-2">
            {links.map((l, i) => (
              <p key={i} className="break-all">
                <span className="font-semibold">{l.text}</span>
                <br />
                <span className="text-ameixa underline">{l.url}</span>
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
