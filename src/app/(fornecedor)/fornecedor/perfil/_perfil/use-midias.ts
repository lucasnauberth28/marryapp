// As imagens do perfil (logo, capa, galeria): cada mudança é salva na hora.
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { atualizarMidiasDoFornecedor, type EntradaDasMidiasDoFornecedor, type MidiasDoFornecedor } from "@/actions/fornecedor/midias";
import { LADO_MAXIMO, LADO_MAXIMO_DO_LOGOTIPO, comprimirImagem, erroDeCompressao } from "./comprimir-imagem";

type TipoDeImagem = "logo" | "cover" | "gallery";

const AVISOS: Record<TipoDeImagem, string> = { logo: "Logo atualizado.", cover: "Capa atualizada.", gallery: "Foto adicionada à galeria." };
const ACOES = { logo: "set-logo", cover: "set-cover", gallery: "add-gallery" } as const;

export function useMidias(inicial: MidiasDoFornecedor) {
  const [media, setMedia] = useState<MidiasDoFornecedor>(inicial);
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function run(key: string, op: () => Promise<EntradaDasMidiasDoFornecedor | null>, success: string) {
    setBusy(key);
    startTransition(async () => {
      try {
        const input = await op();
        if (!input) return;
        const res = await atualizarMidiasDoFornecedor(input);
        if (!res.success) return void toast.error(res.error);
        setMedia(res.media);
        toast.success(success);
      } catch (error) {
        toast.error(erroDeCompressao(error));
      } finally {
        setBusy(null);
      }
    });
  }

  const aoEscolher = (kind: TipoDeImagem) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (!file) return;
    const lado = kind === "logo" ? LADO_MAXIMO_DO_LOGOTIPO : LADO_MAXIMO;
    run(kind, async () => ({ action: ACOES[kind], image: await comprimirImagem(file, lado) }), AVISOS[kind]);
  };

  return { media, busy, run, aoEscolher };
}

export type Midias = ReturnType<typeof useMidias>;
