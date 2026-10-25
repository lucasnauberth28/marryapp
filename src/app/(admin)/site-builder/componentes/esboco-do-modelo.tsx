// Esboço de cada modelo no seletor: a composição da capa em miniatura, com as cores do próprio modelo.
import type { ReactNode } from "react";
import type { ModeloDoSite } from "@/components/public/site-do-casamento/modelos/catalogo";

const linha = (cor: string, largura: string, espessura = "h-1") => <span className={`block ${espessura} rounded-sm`} style={{ backgroundColor: cor, width: largura }} />;

type Cores = { texto: string; apoio: string; destaque: string; faixa: string; linha: string; cartao: string; fundo: string };

const ESBOCOS: Record<ModeloDoSite["id"], (c: Cores) => ReactNode> = {
  classico: (c) => (
    <span className="flex h-full flex-col items-center justify-center gap-1.5">
      <span className="h-14 w-10 rounded-t-full" style={{ backgroundColor: c.linha }} />{linha(c.texto, "46%", "h-1.5")}{linha(c.apoio, "30%")}
    </span>
  ),
  arco: (c) => (
    <span className="grid h-full grid-cols-[1fr_auto_1fr] items-center gap-2 p-2">
      <span className="flex flex-col gap-1">{linha(c.texto, "90%", "h-1.5")}{linha(c.apoio, "60%")}<span className="mt-1 h-2.5 w-9 rounded-full" style={{ backgroundColor: c.destaque }} /></span>
      <span className="h-[72px] w-11 rounded-t-full" style={{ backgroundColor: c.linha }} />
      <span className="grid gap-1"><span className="h-8 rounded" style={{ backgroundColor: c.linha }} /><span className="h-8 rounded" style={{ backgroundColor: c.linha }} /></span>
    </span>
  ),
  floral: (c) => (
    <span className="grid h-full grid-cols-2 items-center gap-2 p-2">
      <span className="flex flex-col gap-1">{linha(c.texto, "95%", "h-2")}{linha(c.apoio, "55%")}<span className="mt-1 h-2.5 w-10 rounded-full" style={{ backgroundColor: c.destaque }} /></span>
      <span className="h-[72px] rounded-b-lg" style={{ backgroundColor: c.linha, borderTopLeftRadius: 40, borderTopRightRadius: 22 }} />
    </span>
  ),
  editorial: (c) => (
    <span className="relative block h-full" style={{ backgroundColor: c.apoio }}>
      <span className="absolute inset-x-0 top-0 h-2" style={{ backgroundColor: c.fundo }} />
      <span className="absolute bottom-3 left-3 flex flex-col gap-1">{linha("#fff", "52px", "h-2.5")}{linha("#fff", "40px", "h-2.5")}<span className="mt-1 h-3 w-12" style={{ backgroundColor: c.destaque }} /></span>
    </span>
  ),
  monocromo: (c) => (
    <span className="relative block h-full" style={{ backgroundColor: c.apoio }}>
      <span className="absolute bottom-6 left-3 flex flex-col gap-1">{linha("#fff", "56px", "h-2.5")}{linha("#fff", "44px", "h-2.5")}</span>
      <span className="absolute inset-x-0 bottom-0 h-4" style={{ backgroundColor: c.texto }} />
    </span>
  ),
  noturno: (c) => (
    <span className="flex h-full flex-col justify-between p-2">
      <span className="flex flex-col gap-1">{linha(c.texto, "58%", "h-2")}{linha(c.apoio, "36%")}</span>
      <span className="grid grid-cols-3 gap-1">{[0, 1, 2].map((i) => <span key={i} className="h-8 rounded-md border" style={{ borderColor: c.destaque, backgroundColor: c.cartao }} />)}</span>
    </span>
  ),
  campo: (c) => (
    <span className="flex h-full flex-col justify-between" style={{ backgroundColor: c.apoio }}>
      <span className="m-auto font-display text-3xl italic leading-none text-white">Nós</span>
      <span className="flex gap-1 p-2">{[0, 1, 2].map((i) => <span key={i} className="h-3 w-4" style={{ backgroundColor: c.destaque }} />)}</span>
    </span>
  ),
  papel: (c) => (
    <span className="flex h-full flex-col">
      <span className="grid flex-1 place-items-center" style={{ backgroundColor: c.apoio }}>{linha("#fff", "60%", "h-3")}</span>
      <span className="h-3" style={{ backgroundColor: c.cartao, clipPath: "polygon(0 40%,8% 10%,18% 55%,30% 15%,44% 60%,58% 12%,70% 55%,84% 18%,100% 50%,100% 100%,0 100%)" }} />
      <span className="flex h-7 items-center px-3" style={{ backgroundColor: c.cartao }}>{linha(c.texto, "40%", "h-1.5")}</span>
    </span>
  ),
};

export function EsbocoDoModelo({ modelo }: { modelo: ModeloDoSite }) {
  const { paleta } = modelo;
  const cores: Cores = { texto: paleta.texto, apoio: paleta.apoio, destaque: modelo.destaque, faixa: paleta.faixa, linha: paleta.linha, cartao: paleta.cartao, fundo: paleta.fundo };
  return (
    <span aria-hidden="true" className="block h-[104px] overflow-hidden rounded-lg border" style={{ backgroundColor: paleta.fundo, borderColor: paleta.linha }}>
      {ESBOCOS[modelo.id](cores)}
    </span>
  );
}
