import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

const focusClasses = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "min-h-10 w-full min-w-0 rounded-none border border-border bg-card px-2.5 py-1 text-sm shadow-sm transition-all outline-none placeholder:text-muted-foreground",
        focusClasses,
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input, focusClasses }
