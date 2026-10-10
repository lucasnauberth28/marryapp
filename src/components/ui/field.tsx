import * as React from "react"
import { AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"

interface FieldProps {
  /** Id do controle (input, select, textarea): o rótulo, a dica e o erro se ligam a ele. */
  htmlFor: string
  label: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  className?: string
  children: React.ReactNode
}

/**
 * Campo do design system: rótulo ligado ao controle, dica e erro com ícone e palavra.
 * O controle usa `id={htmlFor}`, `aria-invalid={!!error}` e
 * `aria-describedby` com `${htmlFor}-dica` e/ou `${htmlFor}-erro`.
 */
export function Field({ htmlFor, label, hint, error, className, children }: FieldProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <label htmlFor={htmlFor} className="text-sm leading-5 font-semibold text-tinta">
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${htmlFor}-dica`} className="text-sm leading-5 text-tinta-suave">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${htmlFor}-erro`} role="alert" className="flex items-center gap-1 text-sm leading-5 font-semibold text-perigo">
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}
