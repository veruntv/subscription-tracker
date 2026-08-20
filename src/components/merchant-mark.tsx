import { categoryTone, initials } from "~/lib/domain/labels";
import type { Category } from "~/lib/domain/types";
import { cn } from "~/lib/utils";

export function MerchantMark({
  name,
  category,
  size = "md",
}: {
  name: string;
  category: Category;
  size?: "sm" | "md";
}) {
  const tone = categoryTone(category);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium",
        tone.bg,
        tone.fg,
        size === "sm" ? "size-7 text-[10px]" : "size-9 text-xs",
      )}
    >
      {initials(name)}
    </span>
  );
}
