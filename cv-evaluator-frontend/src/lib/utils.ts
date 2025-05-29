import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to intelligently merge Tailwind classNames.
 * Example:
 * cn("bg-red-500", isDark && "bg-black") -> "bg-black" if isDark is true
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
