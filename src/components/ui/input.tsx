import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
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

export { Input }
