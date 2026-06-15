"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      // A ballpoint tick box on paper: crisp pencil rule, fills with ink when
      // ticked. Uses the GLOBAL desk tokens so it resolves on the landing page
      // and inside portals (popovers/dialogs) too. No drop shadow.
      "peer h-4 w-4 shrink-0 cursor-pointer rounded-[4px] border border-pencil bg-paper transition-colors",
      "hover:border-ballpoint",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/50 focus-visible:ring-offset-1 focus-visible:ring-offset-paper",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:border-ballpoint data-[state=checked]:bg-ballpoint data-[state=checked]:text-paper",
      "data-[state=indeterminate]:border-ballpoint data-[state=indeterminate]:bg-ballpoint data-[state=indeterminate]:text-paper",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
      <CheckIcon className="h-3.5 w-3.5" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
