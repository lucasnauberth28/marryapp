import type { DisponibilidadeDoDominio } from "@/lib/dominio/domain-availability";
import type { CampoDoPedidoDeDominio } from "@/lib/dominio/domain-order";

export type ConferenciaDeDominio =
  | { state: "idle" }
  | { state: "invalid"; message: string }
  | { state: "checking" }
  | { state: "error"; message: string }
  | { state: DisponibilidadeDoDominio; domain: string };

export type ErrosDoPedido = Partial<Record<CampoDoPedidoDeDominio, string>>;

export interface DadosDoPedido {
  name: string;
  holderName: string;
  holderDocument: string;
  holderEmail: string;
  holderPhone: string;
  accepted: boolean;
}
