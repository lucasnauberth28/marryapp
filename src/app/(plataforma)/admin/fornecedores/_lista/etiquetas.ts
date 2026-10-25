import { Ban, Check, Clock, Pencil } from "lucide-react";
import type { TomDaSituacao } from "@/components/plataforma/status-chip";
import type { ABAS_DE_FORNECEDORES, VisaoDaCuradoria } from "@/lib/platform/vendor-admin";

export const ETIQUETA_DA_VISAO: Record<VisaoDaCuradoria, { tone: TomDaSituacao; icon: typeof Check }> = {
  approved: { tone: "sucesso", icon: Check },
  pending: { tone: "aviso", icon: Clock },
  adjust: { tone: "neutro", icon: Pencil },
  suspended: { tone: "perigo", icon: Ban },
};

export const ROTULO_DA_ABA: Record<(typeof ABAS_DE_FORNECEDORES)[number], string> = {
  todos: "Todos",
  curadoria: "Aguardando curadoria",
  "pro-master": "Pro e Master",
  vencendo: "Vencendo",
  denuncias: "Denúncias",
};
