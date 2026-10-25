"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Campo, juntarIds, type OpcoesDoCampoFlutuante } from "@/components/ui/field"

export type PropriedadesDaAreaDeTexto = React.ComponentProps<"textarea"> &
  Partial<Omit<OpcoesDoCampoFlutuante, "prefix" | "suffix" | "icon" | "trailing">> & {
    /** Classes do controle (textarea) no modo com rótulo. Em `className` vão as da raiz do campo. */
    inputClassName?: string
  }

/**
 * Área de texto.
 *  - Com `label`: campo de formulário com rótulo flutuante (o rótulo repousa na primeira linha).
 *  - Sem `label`: a textarea simples de antes, para casos que não são campo de formulário.
 */
function AreaDeTexto({
  label,
  hint,
  error,
  optional,
  size,
  invalid,
  fieldClassName,
  inputClassName,
  className,
  id,
  ...props
}: PropriedadesDaAreaDeTexto) {
  const autoId = React.useId()

  if (label === undefined || label === null) {
    return (
      <textarea
        id={id}
        data-slot="textarea"
        className={cn(
          "flex min-h-[96px] w-full rounded-xl border border-linha-forte bg-papel px-4 py-3 text-base text-tinta transition-colors outline-none placeholder:text-tinta-suave hover:border-tinta-suave focus-visible:border-ameixa focus-visible:ring-2 focus-visible:ring-ameixa/25 disabled:cursor-not-allowed disabled:bg-areia disabled:opacity-50 aria-invalid:border-2 aria-invalid:border-perigo aria-invalid:ring-0",
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
      size={size}
      multiline
      className={cn(fieldClassName, className)}
    >
      {(c) => (
        <textarea
          {...rest}
          {...c}
          data-slot="textarea"
          required={required}
          placeholder={placeholder || c.placeholder}
          aria-describedby={juntarIds(c["aria-describedby"], describedBy)}
          className={cn(c.className, inputClassName)}
        />
      )}
    </Campo>
  )
}

export { AreaDeTexto as Textarea }
