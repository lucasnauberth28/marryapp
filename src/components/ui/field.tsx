"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { AdornosDoCampo, RodapeDoCampo } from "@/components/ui/campo-pecas"

/*
 * CAMPO COM RÓTULO FLUTUANTE (comportamento da variante "on" do FloatLabel do PrimeVue).
 *
 * Como usar em formulários:
 *   <Input label="E-mail" icon={Mail} type="email" name="email" error={erro} />
 *   <Textarea label="Mensagem" hint="Aparece no convite" />
 *   <SelectTrigger label="Categoria" id="cat">…</SelectTrigger>  (dentro do <Select> do Radix)
 *   <DatePicker label="Data" … />   <TimePicker label="Hora" … />
 *   <SearchableSelect label="Cidade" … />   <NativeSelect label="Status">…</NativeSelect>
 *
 * Para um controle próprio, use o Field com render prop e espalhe `c` no controle:
 *   <Field id="x" label="Algo">{(c) => <input {...c} name="x" />}</Field>
 *
 * Regras que o CSS (float-field.css) exige do controle:
 *  - vir ANTES do rótulo no DOM (o Field já cuida disso);
 *  - input/textarea precisam de `placeholder` não vazio (o `c` traz " "), é assim que o CSS
 *    sabe se há valor, inclusive com preenchimento automático e valor inicial;
 *  - controle customizado usa data-filled="true", data-float="always", aria-expanded ou
 *    role="combobox" (sem data-placeholder quando há valor).
 *
 * Quando NÃO usar: células editáveis em tabelas, campos de busca (lupa + placeholder),
 * checkbox, radio, switch e upload continuam com `Input` sem `label`, `Label` etc.
 */

export type IconeDoCampo = React.ComponentType<
  React.SVGProps<SVGSVGElement> & { strokeWidth?: number | string }
>

/** Opções de rótulo e adornos aceitas por todos os campos prontos (Input, Textarea, Select…). */
export interface OpcoesDoCampoFlutuante {
  /** Texto do rótulo. É também o nome acessível do campo. */
  label: React.ReactNode
  /** Dica abaixo do campo (some enquanto houver erro). */
  hint?: React.ReactNode
  /** Mensagem de erro abaixo do campo; também deixa borda e rótulo em tom de perigo. */
  error?: React.ReactNode
  /** Acrescenta "(opcional)" ao rótulo. */
  optional?: boolean
  /** Ícone à esquerda; o rótulo recua para não encostar nele. */
  icon?: IconeDoCampo
  /** Texto fixo antes do valor (ex.: "R$"). Só aparece com o rótulo no alto. */
  prefix?: string
  /** Texto fixo depois do valor (ex.: "%"). Só aparece com o rótulo no alto. */
  suffix?: string
  /** Adorno à direita (botão de mostrar senha, limpar). */
  trailing?: React.ReactNode
  /** `sm`: campo compacto (44px no celular, 40px no computador). */
  size?: "default" | "sm"
  /** Marca o campo como inválido mesmo sem mensagem. */
  invalid?: boolean
  /** Classes da raiz do campo (largura, grade, margem). */
  fieldClassName?: string
}

export const classeDoControleDoCampo = "ac-float__control"

export interface PropriedadesDoControleDoCampo {
  id: string
  className: string
  placeholder?: string
  "aria-invalid"?: true
  "aria-describedby"?: string
  "aria-required"?: true
}

interface PropriedadesDoCampo extends Omit<OpcoesDoCampoFlutuante, "fieldClassName"> {
  /** Id do controle: rótulo, dica e erro se ligam a ele. */
  id: string
  required?: boolean
  /** Campo de várias linhas: o rótulo repousa na primeira linha. */
  multiline?: boolean
  /** Reserva espaço para a seta à direita (select, data, combobox). */
  chevron?: boolean
  /** `text` entrega `placeholder=" "` ao controle (input/textarea); `custom` não. */
  control?: "text" | "custom"
  /** Classes da raiz. */
  className?: string
  /** Controle e adornos extras dentro da caixa, depois do rótulo (ex.: seta). */
  extra?: React.ReactNode
  /** Recebe os atributos para espalhar no controle. */
  children: (control: PropriedadesDoControleDoCampo) => React.ReactNode
}

/** Junta ids de aria-describedby sem repetir nem deixar vazio. */
export function juntarIds(...ids: Array<string | undefined | false | null>) {
  const out = ids.filter(Boolean).join(" ")
  return out || undefined
}

export function Campo(props: PropriedadesDoCampo) {
  return <CampoFlutuante {...props} />
}

function CampoFlutuante({ id, label, hint, error, optional, required, invalid, icon: Icon, prefix, suffix, trailing, size = "default", multiline, chevron, control = "text", className, extra, children }: PropriedadesDoCampo) {
  const hasError = Boolean(error) || Boolean(invalid)
  const describedBy = juntarIds(Boolean(hint) && !error && `${id}-dica`, error ? `${id}-erro` : false)

  const boxStyle: React.CSSProperties = {}
  if (prefix) (boxStyle as Record<string, string>)["--ac-float-prefix"] = `calc(${[...prefix].length}ch + 6px)`
  if (suffix) (boxStyle as Record<string, string>)["--ac-float-suffix"] = `calc(${[...suffix].length}ch + 6px)`

  return (
    <div className={cn("ac-float", className)}>
      <div
        className={cn(
          "ac-float__box",
          Icon && "ac-float__box--icon",
          trailing && "ac-float__box--trailing",
          chevron && "ac-float__box--chevron",
          multiline && "ac-float__box--multiline",
          size === "sm" && "ac-float__box--sm"
        )}
        style={boxStyle}
      >
        {children({
          id,
          className: classeDoControleDoCampo,
          ...(control === "text" ? { placeholder: " " } : null),
          ...(hasError ? { "aria-invalid": true as const } : null),
          ...(describedBy ? { "aria-describedby": describedBy } : null),
          ...(required ? { "aria-required": true as const } : null),
        })}
        <label htmlFor={id} className="ac-float__label">
          {label}
          {optional ? " (opcional)" : null}
        </label>
        <AdornosDoCampo icon={Icon} prefix={prefix} suffix={suffix} />
        {extra}
        {trailing ? <div className="ac-float__trailing">{trailing}</div> : null}
      </div>
      <RodapeDoCampo id={id} hint={hint} error={error} />
    </div>
  )
}

export { AvisoDoFormulario } from "@/components/ui/campo-pecas"
