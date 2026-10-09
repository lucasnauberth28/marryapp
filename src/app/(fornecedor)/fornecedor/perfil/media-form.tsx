"use client";

import { useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Building2, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Reveal } from "@/components/motion/reveal";
import { updateVendorMedia, type VendorMedia, type VendorMediaInput } from "@/actions/vendor-panel-actions";
import { cn } from "@/lib/utils";
import { MAX_GALLERY_IMAGES } from "../../_lib/vendor-panel";

const CARD = "rounded-2xl border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-1)] sm:p-6";
const HINT = "text-[13px] text-tinta-suave";
const BTN =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60";
const BTN_SECONDARY = `${BTN} border border-linha-forte bg-papel text-tinta hover:bg-areia`;
const ICON_BTN =
  "grid size-11 place-items-center rounded-xl border border-linha-forte bg-papel text-tinta transition-colors hover:bg-areia disabled:pointer-events-none disabled:opacity-40";

const MAX_SIDE = 1600;
const LOGO_MAX_SIDE = 800;
const MAX_DATA_URL_LENGTH = Math.floor(5 * 1024 * 1024 * 1.33); // ~5 MB depois do base64
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("decode"));
    img.src = src;
  });
}

/**
 * Redimensiona no navegador (lado maior até `maxSide`) e comprime em WebP
 * (ou JPEG, se o navegador não gerar WebP). Assim cada envio fica com poucas centenas de KB.
 */
async function compressImage(file: File, maxSide: number): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("type");
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.drawImage(img, 0, 0, width, height);

    for (const quality of [0.85, 0.75, 0.6]) {
      let out = canvas.toDataURL("image/webp", quality);
      if (!out.startsWith("data:image/webp")) {
        // Sem WebP: JPEG sobre fundo branco (JPEG não tem transparência).
        ctx.globalCompositeOperation = "destination-over";
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = "source-over";
        out = canvas.toDataURL("image/jpeg", quality);
      }
      if (out.length <= MAX_DATA_URL_LENGTH) return out;
    }
    throw new Error("size");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function compressError(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "type") return "Escolha um arquivo de imagem (JPG, PNG ou WEBP).";
  if (code === "size") return "A imagem ficou grande demais mesmo comprimida. Tente outra foto.";
  return "Não foi possível ler esta imagem. Tente uma foto em JPG ou PNG.";
}

type Busy = string | null;

export function MediaForm({ initial }: { initial: VendorMedia }) {
  const [media, setMedia] = useState<VendorMedia>(initial);
  const [busy, setBusy] = useState<Busy>(null);
  const [, startTransition] = useTransition();
  const logoInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  function run(key: string, op: () => Promise<VendorMediaInput | null>, success: string) {
    setBusy(key);
    startTransition(async () => {
      try {
        const input = await op();
        if (!input) return;
        const res = await updateVendorMedia(input);
        if (res.success) {
          setMedia(res.media);
          toast.success(success);
        } else {
          toast.error(res.error);
        }
      } catch (error) {
        toast.error(compressError(error));
      } finally {
        setBusy(null);
      }
    });
  }

  function onPick(kind: "logo" | "cover" | "gallery") {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = ""; // permite escolher o mesmo arquivo de novo
      if (!file) return;
      const action = kind === "logo" ? "set-logo" : kind === "cover" ? "set-cover" : "add-gallery";
      const label = kind === "logo" ? "Logo atualizado." : kind === "cover" ? "Capa atualizada." : "Foto adicionada à galeria.";
      run(
        kind,
        async () => ({ action, image: await compressImage(file, kind === "logo" ? LOGO_MAX_SIDE : MAX_SIDE) }),
        label,
      );
    };
  }

  const isBusy = busy !== null;
  const galleryFull = media.gallery.length >= MAX_GALLERY_IMAGES;

  return (
    <Reveal variant="up" delay={200}>
    <section aria-labelledby="fotos-titulo" className={cn(CARD, "flex flex-col gap-6")}>
      <div className="flex flex-col gap-1">
        <h2 id="fotos-titulo" className="text-lg font-semibold">
          Fotos
        </h2>
        <p className={HINT}>
          As fotos são salvas na hora. Reduzimos cada imagem para até {MAX_SIDE} px antes de enviar (JPG, PNG ou WEBP, até 5
          MB).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[auto_minmax(0,1fr)]">
        {/* Logo */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-tinta">Logo</p>
          <div className="grid size-28 place-items-center overflow-hidden rounded-2xl border border-linha bg-areia">
            {media.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={media.logoUrl} alt="Logo atual" className="size-full object-cover" />
            ) : (
              <Building2 aria-hidden="true" className="size-10 text-tinta-suave" />
            )}
          </div>
          <input ref={logoInput} type="file" accept={ACCEPT} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onPick("logo")} />
          <div className="flex gap-2">
            <button type="button" disabled={isBusy} onClick={() => logoInput.current?.click()} className={BTN_SECONDARY}>
              {busy === "logo" ? <Loader2 aria-hidden="true" className="size-[18px] animate-spin" /> : <Upload aria-hidden="true" className="size-[18px]" />}
              {media.logoUrl ? "Trocar" : "Enviar"}
              <span className="sr-only"> logo</span>
            </button>
            {media.logoUrl ? (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => run("logo-remove", async () => ({ action: "remove-logo" }), "Logo removido.")}
                aria-label="Remover logo"
                className={ICON_BTN}
              >
                <Trash2 aria-hidden="true" className="size-[18px]" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Capa */}
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-sm font-semibold text-tinta">Capa</p>
          <div className="grid aspect-[16/7] w-full place-items-center overflow-hidden rounded-2xl border border-linha bg-areia">
            {media.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={media.coverUrl} alt="Capa atual" className="size-full object-cover" />
            ) : (
              <ImagePlus aria-hidden="true" className="size-10 text-tinta-suave" />
            )}
          </div>
          <input ref={coverInput} type="file" accept={ACCEPT} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onPick("cover")} />
          <div className="flex gap-2">
            <button type="button" disabled={isBusy} onClick={() => coverInput.current?.click()} className={BTN_SECONDARY}>
              {busy === "cover" ? <Loader2 aria-hidden="true" className="size-[18px] animate-spin" /> : <Upload aria-hidden="true" className="size-[18px]" />}
              {media.coverUrl ? "Trocar capa" : "Enviar capa"}
            </button>
            {media.coverUrl ? (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => run("cover-remove", async () => ({ action: "remove-cover" }), "Capa removida.")}
                aria-label="Remover capa"
                className={ICON_BTN}
              >
                <Trash2 aria-hidden="true" className="size-[18px]" />
              </button>
            ) : null}
          </div>
          <p className={HINT}>Aparece no card da vitrine. Prefira uma foto horizontal.</p>
        </div>
      </div>

      {/* Galeria */}
      <div className="flex flex-col gap-3 border-t border-linha pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold text-tinta">
              Galeria <span className="font-normal text-tinta-suave">({media.gallery.length} de {MAX_GALLERY_IMAGES})</span>
            </p>
            <p className={HINT}>A primeira foto abre o portfólio no seu perfil. Use as setas para mudar a ordem.</p>
          </div>
          <input ref={galleryInput} type="file" accept={ACCEPT} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onPick("gallery")} />
          <button
            type="button"
            disabled={isBusy || galleryFull}
            onClick={() => galleryInput.current?.click()}
            className={BTN_SECONDARY}
          >
            {busy === "gallery" ? <Loader2 aria-hidden="true" className="size-[18px] animate-spin" /> : <ImagePlus aria-hidden="true" className="size-[18px]" />}
            {galleryFull ? "Galeria completa" : "Adicionar foto"}
          </button>
        </div>

        {media.gallery.length === 0 ? (
          <p className="rounded-xl border border-dashed border-linha-forte px-4 py-8 text-center text-tinta-suave">
            Nenhuma foto na galeria ainda. Casais pedem mais orçamento a perfis com fotos reais de casamentos.
          </p>
        ) : (
          <ol className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-4">
            {media.gallery.map((url, i) => (
              <li key={`${i}-${url.slice(-24)}`} className="flex flex-col gap-2 rounded-xl border border-linha bg-linho p-2">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-areia">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Foto ${i + 1} da galeria`} className="size-full object-cover" />
                  <span className="absolute top-1.5 left-1.5 rounded-full bg-papel/95 px-2 py-0.5 text-xs font-semibold">{i + 1}</span>
                </div>
                <div className="flex justify-between gap-1">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={isBusy || i === 0}
                      onClick={() => run(`move-${i}`, async () => ({ action: "move-gallery", index: i, direction: "up" }), "Ordem atualizada.")}
                      aria-label={`Mover foto ${i + 1} para antes`}
                      className={ICON_BTN}
                    >
                      <ArrowUp aria-hidden="true" className="size-[18px] md:-rotate-90" />
                    </button>
                    <button
                      type="button"
                      disabled={isBusy || i === media.gallery.length - 1}
                      onClick={() => run(`move-${i}`, async () => ({ action: "move-gallery", index: i, direction: "down" }), "Ordem atualizada.")}
                      aria-label={`Mover foto ${i + 1} para depois`}
                      className={ICON_BTN}
                    >
                      <ArrowDown aria-hidden="true" className="size-[18px] md:-rotate-90" />
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => run(`remove-${i}`, async () => ({ action: "remove-gallery", index: i }), "Foto removida.")}
                    aria-label={`Remover foto ${i + 1}`}
                    className={ICON_BTN}
                  >
                    {busy === `remove-${i}` ? (
                      <Loader2 aria-hidden="true" className="size-[18px] animate-spin" />
                    ) : (
                      <Trash2 aria-hidden="true" className="size-[18px]" />
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
    </Reveal>
  );
}
