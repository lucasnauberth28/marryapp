import type { ComponentType, ReactNode, SVGProps } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/** Campo de texto da tela de acesso (altura 48px, ícone à esquerda, foco ameixa). */
export const fieldClass =
  "peer block min-h-12 w-full rounded-[12px] border border-linha-forte bg-papel px-4 text-base leading-6 text-tinta transition-[border-color,box-shadow] duration-200 placeholder:text-tinta-suave/80 hover:border-tinta-suave focus:border-ameixa focus:shadow-[0_0_0_3px_var(--color-ameixa-suave)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ameixa aria-[invalid=true]:border-2 aria-[invalid=true]:border-perigo";

type Icon = ComponentType<SVGProps<SVGSVGElement> & { strokeWidth?: number }>;

interface FieldProps {
  id: string;
  label: string;
  icon?: Icon;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  className?: string;
  /** Recebe as classes e os atributos de acessibilidade para aplicar no controle. */
  children: (control: { className: string; "aria-invalid"?: true; "aria-describedby"?: string }) => ReactNode;
  trailing?: ReactNode;
}

/** Rótulo, controle, dica e erro ligados por id: leitores de tela anunciam tudo junto. */
export function Field({ id, label, icon: IconCmp, hint, error, optional, className, children, trailing }: FieldProps) {
  const describedBy = [hint ? `${id}-dica` : null, error ? `${id}-erro` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-sm font-semibold leading-5 text-tinta">
        {label}
        {optional ? <span className="font-normal text-tinta-suave"> (opcional)</span> : null}
      </label>
      <div className="relative">
        {IconCmp ? (
          <IconCmp
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 z-10 size-[18px] -translate-y-1/2 text-tinta-suave"
            strokeWidth={1.75}
          />
        ) : null}
        {children({
          className: cn(fieldClass, IconCmp && "pl-11", trailing && "pr-12"),
          "aria-invalid": error ? true : undefined,
          "aria-describedby": describedBy,
        })}
        {trailing}
      </div>
      {hint && !error ? (
        <p id={`${id}-dica`} className="text-sm leading-5 text-tinta-suave">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-erro`} className="flex items-center gap-1.5 text-sm font-semibold leading-5 text-perigo">
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" strokeWidth={2} />
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Aviso de erro geral do formulário. */
export function FormAlert({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <div
      id={id}
      role="alert"
      className="flex items-start gap-2.5 rounded-[12px] border border-perigo/25 bg-perigo-suave px-4 py-3 text-sm font-semibold leading-5 text-perigo"
    >
      <CircleAlert aria-hidden="true" className="mt-px size-[18px] shrink-0" strokeWidth={2} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** (11) 98765-4321 enquanto digita. */
export function maskPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** 000.000.000-00 ou 00.000.000/0000-00 enquanto digita. */
export function maskDocument(value: string, type: "CPF" | "CNPJ") {
  const d = value.replace(/\D/g, "").slice(0, type === "CPF" ? 11 : 14);
  if (type === "CPF") {
    return d
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
  }
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}
