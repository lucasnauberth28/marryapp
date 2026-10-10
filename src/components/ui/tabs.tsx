"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

// Abas como controle segmentado (design system): faixa de areia, aba ativa em papel.

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-4", className)} {...props} />
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("inline-flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-areia p-1", className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-[15px] font-semibold whitespace-nowrap text-tinta-suave transition-colors outline-none hover:text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ameixa disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-papel data-[state=active]:text-ameixa data-[state=active]:shadow-[var(--shadow-aceito-1)] sm:min-h-9 [&_svg]:size-4 [&_svg]:shrink-0",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ameixa", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
