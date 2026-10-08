import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-linha bg-papel px-3.5 py-2 text-sm text-tinta transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-tinta-suave focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-areia disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 shadow-xs",
        className
      )}
      {...props}
    />
  )
}

export { Input }
