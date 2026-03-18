import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "min-h-10 w-full min-w-0 rounded-none border border-border bg-card px-2.5 py-1 text-sm shadow-sm transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:bg-background focus-visible:border-ring focus-visible:shadow-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-50 aria-invalid:border-alert-danger-text aria-invalid:bg-alert-danger-bg aria-invalid:ring-3 aria-invalid:ring-alert-danger-text/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-alert-danger-text/50 dark:aria-invalid:ring-alert-danger-text/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
