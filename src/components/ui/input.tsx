"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Campo, juntarIds, type OpcoesDoCampoFlutuante } from "@/components/ui/field"

type PropriedadesDaEntradaNativa = Omit<React.ComponentProps<"input">, "size" | "prefix">

export type PropriedadesDaEntrada = PropriedadesDaEntradaNativa &
  Partial<OpcoesDoCampoFlutuante> & {
    /** Classes do controle (input) no modo com rótulo. Em `className` vão as da raiz do campo. */
    inputClassName?: string
  }

/**
 * Campo de texto.
 *  - Com `label`: campo de formulário com rótulo flutuante (use este nos formulários).
 *  - Sem `label`: o input simples de antes, para casos que não são campo de formulário
 *    (células editáveis, buscas com lupa, etiquetas pequenas).
 */
function Entrada({
  label,
  hint,
  error,
  optional,
  icon,
  prefix,
  suffix,
  trailing,
  size,
  invalid,
  fieldClassName,
  inputClassName,
  className,
  id,
  type,
  ...props
}: PropriedadesDaEntrada) {
  const autoId = React.useId()

  if (label === undefined || label === null) {
    return (
      <input
        id={id}
        type={type}
        data-slot="input"
        className={cn(
          "h-11 w-full min-w-0 rounded-xl border border-linha-forte bg-papel px-4 py-2 text-base text-tinta transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-tinta-suave hover:border-tinta-suave focus-visible:border-ameixa focus-visible:ring-2 focus-visible:ring-ameixa/25 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-areia disabled:opacity-50 aria-invalid:border-2 aria-invalid:border-perigo aria-invalid:ring-0",
          className
        )}
        {...props}
      />
    )
  }

  const fieldId = id ?? autoId
  const { "aria-describedby": describedBy, "aria-invalid": ariaInvalid, placeholder, required, ...rest } = props
  return (
    <Campo
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      required={required}
      invalid={invalid || ariaInvalid === true || ariaInvalid === "true"}
      icon={icon}
      prefix={prefix}
      suffix={suffix}
      trailing={trailing}
      size={size}
      className={cn(fieldClassName, className)}
    >
      {(c) => (
        <input
          {...rest}
          {...c}
          type={type}
          data-slot="input"
          required={required}
          placeholder={placeholder || c.placeholder}
          aria-describedby={juntarIds(c["aria-describedby"], describedBy)}
          className={cn(c.className, inputClassName)}
        />
      )}
    </Campo>
  )
}

export { Entrada }
