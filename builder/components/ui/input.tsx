"use client"

import { forwardRef } from "react"
import { cn } from "@/lib/utils"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm",
        "focus:outline-none focus:ring-2 ring-ring",
        "placeholder:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
