import { initials, markTone } from "~/lib/domain/labels";
import { cn } from "~/lib/utils";

export function MerchantMark({
  name,
  size = "md",
}: {
  name: string;
  category?: string;
  size?: "sm" | "md";
}) {
  const tone = markTone(name);
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
