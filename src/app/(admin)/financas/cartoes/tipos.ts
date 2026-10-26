/** Um cartão do casal como a tela o recebe (limite em centavos). */
export interface CartaoCadastrado {
  id: string;
  bank: string;
  brand: string;
  nickname: string | null;
  lastDigits: string | null;
  limit: number;
  color: string | null;
}
