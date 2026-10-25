import type { ComponentType } from "react";
import type { IdDoModelo } from "../catalogo";
import { LayoutArco } from "./arco";
import { LayoutCampo } from "./campo";
import { LayoutEditorial } from "./editorial";
import { LayoutFloral } from "./floral";
import { LayoutMonocromo } from "./monocromo";
import { LayoutNoturno } from "./noturno";
import { LayoutPapel } from "./papel";
import type { PropriedadesDoLayout } from "./tipos";

/** Cada modelo, menos o Clássico, tem a própria página. O Clássico segue a composição do Aceito (visao-do-site.tsx). */
export const LAYOUTS: Partial<Record<IdDoModelo, ComponentType<PropriedadesDoLayout>>> = {
  papel: LayoutPapel,
  arco: LayoutArco,
  floral: LayoutFloral,
  editorial: LayoutEditorial,
  monocromo: LayoutMonocromo,
  noturno: LayoutNoturno,
  campo: LayoutCampo,
};
