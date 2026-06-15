"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"

// No icon — the title colour signals the type of toast.
const TITLE_COLOR: Record<string, string> = {
  success: "var(--st-answered)", // green — completed
  review: "var(--st-review)", // purple — flagged for review
  destructive: "var(--redpen)", // red — error
  info: "var(--ballpoint)", // blue — informational
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={6000}>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const color = variant ? TITLE_COLOR[variant] : undefined
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex flex-col gap-1 p-4 pr-9">
              {title && (
                <ToastTitle style={color ? { color } : undefined}>{title}</ToastTitle>
              )}
              {description && <ToastDescription>{description}</ToastDescription>}
              {action && <div className="mt-2 flex">{action}</div>}
            </div>
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
