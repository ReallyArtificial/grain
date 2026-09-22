"use client"

import { forwardRef } from "react"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost" | "destructive" | "outline"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 ring-ring disabled:pointer-events-none disabled:opacity-50",
          variant === "default" && "bg-primary text-primary-foreground hover:opacity-90",
          variant === "secondary" && "bg-secondary text-secondary-foreground hover:opacity-80",
          variant === "ghost" && "hover:bg-accent hover:text-accent-foreground",
          variant === "destructive" && "bg-destructive text-destructive-foreground hover:opacity-90",
          variant === "outline" && "border border-border bg-transparent hover:bg-accent",
          size === "default" && "h-9 px-4 py-2",
          size === "sm" && "h-7 px-3 text-xs",
          size === "lg" && "h-11 px-8",
          size === "icon" && "h-9 w-9",
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
