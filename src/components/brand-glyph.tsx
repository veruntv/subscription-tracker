import type { Brand } from "~/lib/domain/brands";
import { cn } from "~/lib/utils";

export function BrandGlyph({
  brand,
  size = "md",
}: {
  brand: Brand;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "size-7 p-1.5" : "size-9 p-2";
  if (brand.paths.length === 0) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full text-xs font-medium text-lilac",
          size === "sm" ? "size-7" : "size-9",
        )}
        style={{ backgroundColor: `#${brand.hex}` }}
        aria-hidden
      >
        {brand.name.slice(0, 1)}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-white shadow-border",
        box,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-full" role="img" aria-label={brand.name}>
        {brand.paths.map((d, index) => (
          <path key={index} d={d} fill={`#${brand.hex}`} />
        ))}
      </svg>
    </span>
  );
}
