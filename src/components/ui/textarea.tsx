import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-800 transition-colors outline-none placeholder:text-stone-400 focus-visible:border-[#8C6D45] focus-visible:ring-2 focus-visible:ring-[#8C6D45]/20 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 shadow-xs",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
