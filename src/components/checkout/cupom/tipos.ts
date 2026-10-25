export interface CupomAplicado {
  code: string;
  /** Plano para o qual o cupom foi conferido. */
  planId: string;
  price: number;
  credit: number;
  discount: number;
  total: number;
}
