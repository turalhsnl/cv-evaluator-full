import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollAreaPrimitive.Scrollbar
      orientation="vertical"
      className="flex select-none touch-none p-0.5 transition-colors duration-[160ms] ease-out hover:bg-gray-200 dark:hover:bg-gray-700"
    >
      <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-gray-400 dark:bg-gray-600" />
    </ScrollAreaPrimitive.Scrollbar>
    <ScrollAreaPrimitive.Scrollbar
      orientation="horizontal"
      className="flex select-none touch-none p-0.5 transition-colors duration-[160ms] ease-out hover:bg-gray-200 dark:hover:bg-gray-700"
    >
      <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-gray-400 dark:bg-gray-600" />
    </ScrollAreaPrimitive.Scrollbar>
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
));

ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

export { ScrollArea };
