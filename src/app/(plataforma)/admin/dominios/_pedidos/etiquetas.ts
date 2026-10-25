import { Check, Clock, Globe, Hourglass, XCircle } from "lucide-react";
import type { NomeDaSituacaoDoPedidoDeDominio } from "@/lib/dominio/domain-order";
import type { TomDaSituacao } from "@/components/plataforma/status-chip";
import type { AbaDeDominios } from "@/lib/platform/queries/dominios";

export const ROTULO_DA_ABA: Record<AbaDeDominios, string> = { todos: "Todos", pedido: "Pedido recebido", registro: "Em registro", registrado: "Registrado", "no-ar": "No ar", recusado: "Recusado" };

export const ETIQUETA_DA_SITUACAO: Record<NomeDaSituacaoDoPedidoDeDominio, { tone: TomDaSituacao; icon: typeof Clock }> = {
  REQUESTED: { tone: "aviso", icon: Clock },
  REGISTERING: { tone: "neutro", icon: Hourglass },
  REGISTERED: { tone: "aviso", icon: Check },
  CONNECTED: { tone: "sucesso", icon: Globe },
  REJECTED: { tone: "perigo", icon: XCircle },
  CANCELED: { tone: "neutro", icon: XCircle },
};

export const etiquetaDaSituacao = (status: string) => ETIQUETA_DA_SITUACAO[status as NomeDaSituacaoDoPedidoDeDominio] ?? ETIQUETA_DA_SITUACAO.CANCELED;
