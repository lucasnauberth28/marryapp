import { cn } from "@/lib/utils";

/** O "G" colorido do Google, no desenho que as regras de marca do Google pedem para o botão de entrar. */
function LogotipoDoGoogle() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="size-[18px] shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65Z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19Z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
    </svg>
  );
}

interface PropriedadesDoBotaoDoGoogle {
  /** De onde a pessoa vem: "entrar" (login) ou "criar" (cadastro). */
  modo: "entrar" | "criar";
  /** O que levar de ida e volta: caminho de retorno, plano, tipo de conta, recursos do plano adaptado, convite. */
  parametros?: { proxima?: string | null; plano?: string | null; tipo?: string | null; modulos?: string[] | null; convite?: string | null };
  children?: React.ReactNode;
  className?: string;
}

/** "Continuar com o Google": leva a pessoa à rota que começa o fluxo (navegação completa, não é link do app). */
export function BotaoDoGoogle({ modo, parametros = {}, children = "Continuar com o Google", className }: PropriedadesDoBotaoDoGoogle) {
  const consulta = new URLSearchParams({ modo });
  if (parametros.proxima) consulta.set("proxima", parametros.proxima);
  if (parametros.plano) consulta.set("plano", parametros.plano);
  if (parametros.tipo) consulta.set("tipo", parametros.tipo);
  if (parametros.modulos?.length) consulta.set("modulos", parametros.modulos.join(","));
  if (parametros.convite) consulta.set("convite", parametros.convite);
  return (
    <a
      href={`/api/auth/google/iniciar?${consulta}`}
      className={cn(
        "flex min-h-12 w-full items-center justify-center gap-3 rounded-[12px] border border-[#747775] bg-[#fff] px-6 text-[15px] font-medium text-[#1F1F1F] no-underline transition-colors hover:bg-[#F8FAFD] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ameixa dark:border-[#8E918F] dark:bg-[#131314] dark:text-[#E3E3E3] dark:hover:bg-[#1E1F20]",
        className,
      )}
    >
      <LogotipoDoGoogle />
      {children}
    </a>
  );
}

/** "ou" entre o botão do Google e o formulário de e-mail e senha. */
export function SeparadorOu() {
  return (
    <div role="separator" className="flex items-center gap-3 text-sm text-tinta-suave">
      <span className="h-px flex-1 bg-linha" />
      ou
      <span className="h-px flex-1 bg-linha" />
    </div>
  );
}
