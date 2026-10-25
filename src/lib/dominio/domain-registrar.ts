// Camada de registro do domínio. Hoje o registro é MANUAL: o dono do Aceito registra no Registro.br,
// no nome do titular, e marca o pedido como registrado na fila de /dominios.
// Para automatizar a compra no futuro, crie outro objeto que cumpra `DomainRegistrar` (provedor com API),
// devolva `{ kind: "registered", ... }` em `register` e troque o retorno de `getRegistrar()`.
// As telas e as ações só falam com esta interface, nunca com um provedor específico.

interface PedidoParaORegistrador {
  id: string;
  domain: string;
  holderName: string;
  /** CPF/CNPJ completo (só existe enquanto o pedido está aberto). */
  holderDocument: string;
  holderEmail: string;
  holderPhone: string;
}

type ResultadoDoRegistrador =
  /** O pedido fica na fila: uma pessoa registra à mão e marca como registrado. */
  | { kind: "manual" }
  /** O provedor já registrou (compra automática). */
  | { kind: "registered"; registeredAt: Date; expiresAt: Date; providerRef?: string }
  | { kind: "failed"; reason: string };

export interface RegistradorDeDominio {
  /** Nome curto, para registro de atividades e telas internas. */
  readonly id: string;
  /** Chamado quando o registro começa (botão "Começar o registro"). */
  register(order: PedidoParaORegistrador): Promise<ResultadoDoRegistrador>;
}

/** Registro manual: não faz nada além de deixar o pedido na fila. */
const registradorManual: RegistradorDeDominio = {
  id: "manual",
  async register() {
    return { kind: "manual" };
  },
};

export function obterRegistrador(): RegistradorDeDominio {
  return registradorManual;
}
