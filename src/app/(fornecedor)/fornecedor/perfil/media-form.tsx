"use client";

import { useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Building2, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Aparicao } from "@/components/motion/reveal";
import { atualizarMidiasDoFornecedor, type MidiasDoFornecedor, type EntradaDasMidiasDoFornecedor } from "@/actions/vendor-panel-actions";
import { EsqueletoDeImagem } from "@/components/skeletons";
import { Esqueleto } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MAXIMO_DE_IMAGENS_NA_GALERIA } from "../../_lib/vendor-panel";

const ESTILO_DO_CARTAO = "rounded-2xl border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-1)] sm:p-6";
const ESTILO_DA_DICA = "text-[13px] text-tinta-suave";
const ESTILO_DO_BOTAO =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60";
const ESTILO_DO_BOTAO_SECUNDARIO = `${ESTILO_DO_BOTAO} border border-linha-forte bg-papel text-tinta hover:bg-areia`;
const ESTILO_DO_BOTAO_DE_ICONE =
  "grid size-11 place-items-center rounded-xl border border-linha-forte bg-papel text-tinta transition-colors hover:bg-areia disabled:pointer-events-none disabled:opacity-40";

const LADO_MAXIMO = 1600;
const LADO_MAXIMO_DO_LOGOTIPO = 800;
const TAMANHO_MAXIMO_DA_DATA_URL = Math.floor(5 * 1024 * 1024 * 1.33); // ~5 MB depois do base64
const TIPOS_ACEITOS = "image/jpeg,image/png,image/webp,image/avif";

function carregarImagem(src: string): Promise<HTMLImageElement> {
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
async function comprimirImagem(file: File, maxSide: number): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("type");
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await carregarImagem(objectUrl);
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
      if (out.length <= TAMANHO_MAXIMO_DA_DATA_URL) return out;
    }
    throw new Error("size");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function erroDeCompressao(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "type") return "Escolha um arquivo de imagem (JPG, PNG ou WEBP).";
  if (code === "size") return "A imagem ficou grande demais mesmo comprimida. Tente outra foto.";
  return "Não foi possível ler esta imagem. Tente uma foto em JPG ou PNG.";
}

type EstadoOcupado = string | null;

export function FormularioDeMidias({ initial }: { initial: MidiasDoFornecedor }) {
  const [media, setMedia] = useState<MidiasDoFornecedor>(initial);
  const [busy, setBusy] = useState<EstadoOcupado>(null);
  const [, startTransition] = useTransition();
  const logoInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  function run(key: string, op: () => Promise<EntradaDasMidiasDoFornecedor | null>, success: string) {
    setBusy(key);
    startTransition(async () => {
      try {
        const input = await op();
        if (!input) return;
        const res = await atualizarMidiasDoFornecedor(input);
        if (res.success) {
          setMedia(res.media);
          toast.success(success);
        } else {
          toast.error(res.error);
        }
      } catch (error) {
        toast.error(erroDeCompressao(error));
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
        async () => ({ action, image: await comprimirImagem(file, kind === "logo" ? LADO_MAXIMO_DO_LOGOTIPO : LADO_MAXIMO) }),
        label,
      );
    };
  }

  const isBusy = busy !== null;
  const galleryFull = media.gallery.length >= MAXIMO_DE_IMAGENS_NA_GALERIA;

  return (
    <Aparicao variant="up" delay={200}>
    <section aria-labelledby="fotos-titulo" className={cn(ESTILO_DO_CARTAO, "flex flex-col gap-6")}>
      <div className="flex flex-col gap-1">
        <h2 id="fotos-titulo" className="text-xl leading-7 font-semibold">
          Portfólio
        </h2>
        <p className={ESTILO_DA_DICA}>
          As fotos são salvas na hora. Reduzimos cada imagem para até {LADO_MAXIMO} px antes de enviar (JPG, PNG ou WEBP, até 5
          MB).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[auto_minmax(0,1fr)]">
        {/* Logo */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-tinta">Logo</p>
          <div className="relative grid size-28 place-items-center overflow-hidden rounded-2xl border border-linha bg-areia">
            {busy === "logo" ? <Esqueleto className="absolute inset-0 z-10 rounded-none" /> : null}
            {media.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={media.logoUrl} alt="Logo atual" className="size-full object-cover" />
            ) : (
              <Building2 aria-hidden="true" className="size-10 text-tinta-suave" />
            )}
          </div>
          <input ref={logoInput} type="file" accept={TIPOS_ACEITOS} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onPick("logo")} />
          <div className="flex gap-2">
            <button type="button" disabled={isBusy} onClick={() => logoInput.current?.click()} className={ESTILO_DO_BOTAO_SECUNDARIO}>
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
                className={ESTILO_DO_BOTAO_DE_ICONE}
              >
                <Trash2 aria-hidden="true" className="size-[18px]" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Capa */}
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-sm font-semibold text-tinta">Capa</p>
          <div className="relative grid aspect-[16/7] w-full place-items-center overflow-hidden rounded-2xl border border-linha bg-areia">
            {busy === "cover" ? <Esqueleto className="absolute inset-0 z-10 rounded-none" /> : null}
            {media.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={media.coverUrl} alt="Capa atual" className="size-full object-cover" />
            ) : (
              <ImagePlus aria-hidden="true" className="size-10 text-tinta-suave" />
            )}
          </div>
          <input ref={coverInput} type="file" accept={TIPOS_ACEITOS} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onPick("cover")} />
          <div className="flex gap-2">
            <button type="button" disabled={isBusy} onClick={() => coverInput.current?.click()} className={ESTILO_DO_BOTAO_SECUNDARIO}>
              {busy === "cover" ? <Loader2 aria-hidden="true" className="size-[18px] animate-spin" /> : <Upload aria-hidden="true" className="size-[18px]" />}
              {media.coverUrl ? "Trocar capa" : "Enviar capa"}
            </button>
            {media.coverUrl ? (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => run("cover-remove", async () => ({ action: "remove-cover" }), "Capa removida.")}
                aria-label="Remover capa"
                className={ESTILO_DO_BOTAO_DE_ICONE}
              >
                <Trash2 aria-hidden="true" className="size-[18px]" />
              </button>
            ) : null}
          </div>
          <p className={ESTILO_DA_DICA}>Aparece no card da lista de fornecedores. Prefira uma foto horizontal.</p>
        </div>
      </div>

      {/* Galeria */}
      <div className="flex flex-col gap-3 border-t border-linha pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold text-tinta">
              Galeria <span className="font-normal text-tinta-suave">({media.gallery.length} de {MAXIMO_DE_IMAGENS_NA_GALERIA})</span>
            </p>
            <p className={ESTILO_DA_DICA}>A primeira foto abre o portfólio no seu perfil. Use as setas para mudar a ordem.</p>
          </div>
          <input ref={galleryInput} type="file" accept={TIPOS_ACEITOS} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onPick("gallery")} />
          <button
            type="button"
            disabled={isBusy || galleryFull}
            onClick={() => galleryInput.current?.click()}
            className={ESTILO_DO_BOTAO_SECUNDARIO}
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
          <ol className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {media.gallery.map((url, i) => (
              <li key={`${i}-${url.slice(-24)}`} className="flex flex-col gap-2 rounded-xl border border-linha bg-linho p-2">
                <div className={cn("relative aspect-[4/3] overflow-hidden rounded-lg bg-areia", i === 0 && "outline-2 outline-offset-[3px] outline-ameixa")}>
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
                      className={ESTILO_DO_BOTAO_DE_ICONE}
                    >
                      <ArrowUp aria-hidden="true" className="size-[18px] md:-rotate-90" />
                    </button>
                    <button
                      type="button"
                      disabled={isBusy || i === media.gallery.length - 1}
                      onClick={() => run(`move-${i}`, async () => ({ action: "move-gallery", index: i, direction: "down" }), "Ordem atualizada.")}
                      aria-label={`Mover foto ${i + 1} para depois`}
                      className={ESTILO_DO_BOTAO_DE_ICONE}
                    >
                      <ArrowDown aria-hidden="true" className="size-[18px] md:-rotate-90" />
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => run(`remove-${i}`, async () => ({ action: "remove-gallery", index: i }), "Foto removida.")}
                    aria-label={`Remover foto ${i + 1}`}
                    className={ESTILO_DO_BOTAO_DE_ICONE}
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
            {busy === "gallery" ? (
              <li aria-hidden="true" className="flex flex-col gap-2 rounded-xl border border-linha bg-linho p-2">
                <EsqueletoDeImagem ratio="4/3" className="rounded-lg" />
                <div className="h-11" />
              </li>
            ) : null}
          </ol>
        )}
      </div>
    </section>
    </Aparicao>
  );
}
