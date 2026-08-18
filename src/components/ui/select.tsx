import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-md bg-surface px-3 text-sm text-fg shadow-border outline-none transition-[box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-accent/30",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
