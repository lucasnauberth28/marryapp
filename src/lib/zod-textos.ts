import { z } from "zod";

/** Texto opcional de formulário: com espaços aparados, até `max` letras, ausente ou vazio. */
export const textoOpcional = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
