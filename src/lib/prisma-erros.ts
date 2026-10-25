import { Prisma } from "@prisma/client";

/** Código do erro conhecido do Prisma (por exemplo "P2002"), ou undefined se o erro for de outro tipo. */
export function codigoDoErroDoPrisma(error: unknown): string | undefined {
  return error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined;
}

/** O banco recusou por valor repetido numa coluna única (P2002). */
export function ehViolacaoDeUnicidade(error: unknown): boolean {
  return codigoDoErroDoPrisma(error) === "P2002";
}
