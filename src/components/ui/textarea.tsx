import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[96px] w-full rounded-xl border border-linha-forte bg-papel px-4 py-3 text-base text-tinta transition-colors outline-none placeholder:text-tinta-suave hover:border-tinta-suave focus-visible:border-ameixa focus-visible:ring-2 focus-visible:ring-ameixa/25 disabled:cursor-not-allowed disabled:bg-areia disabled:opacity-50 aria-invalid:border-2 aria-invalid:border-perigo aria-invalid:ring-0",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
