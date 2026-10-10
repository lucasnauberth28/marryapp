import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3 data-[variant=sucesso]:[&>svg]:size-4 data-[variant=aviso]:[&>svg]:size-4 data-[variant=perigo]:[&>svg]:size-4 data-[variant=neutro]:[&>svg]:size-4 data-[variant=categoria]:[&>svg]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        // Chips de status do design system: sempre com ícone e palavra (o ícone vai como filho).
        sucesso: "h-7 rounded-md bg-sucesso-suave px-2.5 text-sm font-semibold text-sucesso",
        aviso: "h-7 rounded-md bg-aviso-suave px-2.5 text-sm font-semibold text-aviso",
        perigo: "h-7 rounded-md bg-perigo-suave px-2.5 text-sm font-semibold text-perigo",
        neutro: "h-7 rounded-md bg-areia px-2.5 text-sm font-semibold text-tinta-suave",
        categoria: "h-7 rounded-md bg-salvia-suave px-2.5 text-sm font-semibold text-salvia",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
