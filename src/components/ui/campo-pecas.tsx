import * as React from "react"
import { CircleAlert } from "lucide-react"

import type { IconeDoCampo } from "@/components/ui/field"

export function AdornosDoCampo({ icon: Icon, prefix, suffix }: { icon?: IconeDoCampo; prefix?: string; suffix?: string }) {
  return (
    <>
      {Icon ? <Icon aria-hidden="true" className="ac-float__icon" strokeWidth={1.6} /> : null}
      {prefix ? (
        <span aria-hidden="true" className="ac-float__affix ac-float__affix--prefix">
          {prefix}
        </span>
      ) : null}
      {suffix ? (
        <span aria-hidden="true" className="ac-float__affix ac-float__affix--suffix">
          {suffix}
        </span>
      ) : null}
    </>
  )
}

export function RodapeDoCampo({ id, hint, error }: { id: string; hint: React.ReactNode; error: React.ReactNode }) {
  return (
    <>
      {hint && !error ? (
        <p id={`${id}-dica`} className="ac-float__hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-erro`} role="alert" className="ac-float__error">
          <CircleAlert aria-hidden="true" strokeWidth={2} />
          <span>{error}</span>
        </p>
      ) : null}
    </>
  )
}

/** Aviso de erro geral do formulário. */
export function AvisoDoFormulario({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <div
      id={id}
      role="alert"
      className="flex items-start gap-2.5 rounded-[12px] border border-perigo/25 bg-perigo-suave px-4 py-3 text-sm font-semibold leading-5 text-perigo"
    >
      <CircleAlert aria-hidden="true" className="mt-px size-[18px] shrink-0" strokeWidth={2} />
      <div className="min-w-0">{children}</div>
    </div>
  )
}
