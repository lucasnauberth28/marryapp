"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { ChevronDownIcon } from "lucide-react"
import { Campo, juntarIds, type OpcoesDoCampoFlutuante } from "@/components/ui/field"

function Selecao({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function GrupoDaSelecao({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  )
}

function ValorDaSelecao({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

type PropriedadesDoGatilhoDaSelecao = React.ComponentProps<typeof SelectPrimitive.Trigger> &
  Partial<OpcoesDoCampoFlutuante> & {
    size?: "sm" | "default" | "lg"
  }

function GatilhoSimples({ className, size, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger> & { size: "sm" | "default" | "lg" }) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-xl border border-linha-forte bg-papel px-4 py-2 text-base text-tinta transition-colors outline-none select-none hover:border-tinta-suave focus-visible:border-ameixa focus-visible:ring-2 focus-visible:ring-ameixa/25 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-2 aria-invalid:border-perigo data-placeholder:text-tinta-suave data-[size=default]:h-11 data-[size=sm]:h-11 data-[size=sm]:sm:h-9 data-[size=sm]:text-sm data-[size=lg]:h-12 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="pointer-events-none size-4 text-tinta-suave shrink-0" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

/**
 * Gatilho do seletor.
 *  - Com `label`: campo de formulário com rótulo flutuante (sem valor, o campo fica em branco e
 *    o rótulo no centro; com valor, o rótulo sobe). Dê um `id` quando precisar ligar a algo.
 *  - Sem `label`: o gatilho simples de antes (filtros e menus compactos).
 * Em `className`, no modo com rótulo, vão as classes da raiz do campo.
 */
function GatilhoDaSelecao({
  className,
  size = "default",
  children,
  label,
  hint,
  error,
  optional,
  icon,
  invalid,
  fieldClassName,
  id,
  ...props
}: PropriedadesDoGatilhoDaSelecao) {
  const autoId = React.useId()

  if (label === undefined || label === null) return <GatilhoSimples id={id} size={size} className={className} {...props}>{children}</GatilhoSimples>

  const { "aria-describedby": describedBy, "aria-invalid": ariaInvalid, "aria-required": ariaRequired, ...rest } = props
  return (
    <Campo
      id={id ?? autoId}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      required={ariaRequired === true || ariaRequired === "true"}
      invalid={invalid || ariaInvalid === true || ariaInvalid === "true"}
      icon={icon}
      size={size === "sm" ? "sm" : "default"}
      chevron
      control="custom"
      className={cn(fieldClassName, className)}
      extra={<ChevronDownIcon aria-hidden="true" className="ac-float__chevron" />}
    >
      {(c) => (
        <SelectPrimitive.Trigger
          {...rest}
          {...c}
          data-slot="select-trigger"
          data-size={size}
          aria-describedby={juntarIds(c["aria-describedby"], describedBy)}
        >
          {children}
        </SelectPrimitive.Trigger>
      )}
    </Campo>
  )
}

type PropriedadesDaSelecaoNativa = Omit<React.ComponentProps<"select">, "size"> &
  Partial<Omit<OpcoesDoCampoFlutuante, "prefix" | "suffix" | "trailing">> & {
    /** Classes do select no modo com rótulo. Em `className` vão as da raiz do campo. */
    inputClassName?: string
    /** O rótulo fica sempre no alto e a opção de valor vazio aparece (ex.: "Qualquer valor"). */
    alwaysFloat?: boolean
  }

/**
 * Select nativo (`<select>` do navegador) com rótulo flutuante. Útil em formulários simples e
 * em listas longas no celular. Para mostrar o rótulo no centro quando nada foi escolhido, a
 * primeira opção deve ter `value=""`; com qualquer outro valor o rótulo sobe.
 */
function SelecaoNativa({
  label,
  hint,
  error,
  optional,
  icon,
  size,
  invalid,
  fieldClassName,
  inputClassName,
  alwaysFloat,
  className,
  id,
  children,
  ...props
}: PropriedadesDaSelecaoNativa) {
  const autoId = React.useId()
  const { "aria-describedby": describedBy, "aria-invalid": ariaInvalid, required, ...rest } = props
  return (
    <Campo
      id={id ?? autoId}
      label={label ?? ""}
      hint={hint}
      error={error}
      optional={optional}
      required={required}
      invalid={invalid || ariaInvalid === true || ariaInvalid === "true"}
      icon={icon}
      size={size}
      chevron
      control="custom"
      className={cn(fieldClassName, className)}
      extra={<ChevronDownIcon aria-hidden="true" className="ac-float__chevron" />}
    >
      {(c) => (
        <select
          {...rest}
          {...c}
          data-slot="native-select"
          data-float={alwaysFloat ? "always" : undefined}
          required={required}
          aria-describedby={juntarIds(c["aria-describedby"], describedBy)}
          className={cn(c.className, inputClassName)}
        >
          {children}
        </select>
      )}
    </Campo>
  )
}

export { ConteudoDaSelecao, ItemDaSelecao, RotuloDaSelecao, SeparadorDaSelecao, BotaoDeRolarParaBaixo, BotaoDeRolarParaCima } from "@/components/ui/select-pecas"

export { SelecaoNativa, Selecao, GrupoDaSelecao, GatilhoDaSelecao, ValorDaSelecao }
