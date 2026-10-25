import { useId, useState } from "react";
import { ImagePlus } from "lucide-react";

/** Escolha da foto do presente, com a prévia dentro da própria caixa. */
export function CampoDeFotoDoPresente() {
  const uid = useId();
  const [previa, setPrevia] = useState<string | null>(null);

  function aoEscolher(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPrevia(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-1.5">
      <span id={`${uid}-img`} className="text-sm font-semibold text-tinta">
        Foto do presente <span className="font-normal text-tinta-suave">(opcional)</span>
      </span>
      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-linha-forte border-dashed rounded-xl cursor-pointer hover:bg-linho transition-colors relative overflow-hidden focus-within:outline-2 focus-within:outline-offset-[3px] focus-within:outline-ameixa">
          {previa ? (
            // eslint-disable-next-line @next/next/no-img-element -- prévia local (data URL), não passa pelo otimizador
            <img src={previa} alt="Prévia da foto escolhida" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <ImagePlus className="w-8 h-8 text-tinta-suave mb-2" />
              <p className="text-sm text-tinta-suave font-medium">Toque para escolher uma foto</p>
              <p className="text-xs text-tinta-suave mt-1">JPG, PNG ou WEBP</p>
            </div>
          )}
          <input type="file" name="image" accept="image/*" aria-labelledby={`${uid}-img`} className="sr-only" onChange={aoEscolher} />
        </label>
      </div>
    </div>
  );
}
