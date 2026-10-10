import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

// Botões do design system: um primário por tela, 44px de altura (36px compacto no computador).
const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-transparent bg-clip-padding text-base font-semibold whitespace-nowrap transition-colors duration-150 outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ameixa active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-ameixa text-on-ameixa hover:bg-ameixa-hover",
        /** Igual ao default, com o nome do design system. */
        primary: "bg-ameixa text-on-ameixa hover:bg-ameixa-hover",
        outline:
          "border-linha-forte bg-papel text-tinta hover:bg-ameixa-suave aria-expanded:bg-ameixa-suave",
        secondary:
          "bg-ameixa-suave text-ameixa hover:bg-ameixa-suave/70 aria-expanded:bg-ameixa-suave",
        ghost:
          "text-tinta hover:bg-areia aria-expanded:bg-areia",
        /** Ação discreta: texto ameixa, sem borda. */
        quiet: "text-ameixa hover:bg-ameixa-suave aria-expanded:bg-ameixa-suave",
        destructive:
          "border-perigo bg-papel text-perigo hover:bg-perigo-suave focus-visible:outline-perigo",
        /** Igual ao destructive, com o nome do design system. */
        danger:
          "border-perigo bg-papel text-perigo hover:bg-perigo-suave focus-visible:outline-perigo",
        link: "text-ameixa underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-11 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xs: "h-9 gap-1 rounded-lg px-2.5 text-xs in-data-[slot=button-group]:rounded-lg sm:h-7 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-11 gap-1.5 px-4 text-sm in-data-[slot=button-group]:rounded-lg sm:h-9 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-6 has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        icon: "size-11",
        "icon-xs":
          "size-9 rounded-lg in-data-[slot=button-group]:rounded-lg sm:size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-11 rounded-lg in-data-[slot=button-group]:rounded-lg sm:size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
