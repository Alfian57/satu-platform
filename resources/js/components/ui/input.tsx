import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-input bg-card text-card-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground ease-ledger flex h-control-md w-full min-w-0 rounded-md border px-3.5 py-2 text-base transition-[color,background-color,border-color,box-shadow] duration-fast file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none md:text-sm",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:outline-none",
        "aria-invalid:border-destructive aria-invalid:outline-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
