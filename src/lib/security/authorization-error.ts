// Erro de permissão compartilhado pelos guards. Sem dependências: roda no servidor e nos testes.
export class ErroDeAutorizacao extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}
