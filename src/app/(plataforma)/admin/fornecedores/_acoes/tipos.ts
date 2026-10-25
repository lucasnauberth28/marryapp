import type { useAcaoDoPainel } from "../../_sistema/use-acao-do-painel";

export const ESTILO_DE_PERIGO = "border-perigo text-perigo hover:border-perigo hover:bg-perigo-suave";

export type AcoesDoPainel = ReturnType<typeof useAcaoDoPainel>;
