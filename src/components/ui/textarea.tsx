import * as React from "react"

import { cn } from "@/lib/utils"
import { focusClasses } from "./input"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-none border border-border bg-card px-2.5 py-2 text-sm leading-relaxed transition-all outline-none placeholder:text-muted-foreground",
        focusClasses,
        "disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
