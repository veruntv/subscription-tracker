import { useEffect, useId, useMemo, useRef, useState } from "react";

import { BrandGlyph } from "~/components/brand-glyph";
import { Input } from "~/components/ui/input";
import { resolveBrand, suggestBrands, type Brand } from "~/lib/domain/brands";
import { cn } from "~/lib/utils";

export function BrandNameField({
  id,
  value,
  onChange,
  onPick,
}: {
  id: string;
  value: string;
  onChange: (name: string) => void;
  onPick: (brand: Brand) => void;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const suggestions = useMemo(() => suggestBrands(value), [value]);
  const resolved = resolveBrand(value);

  useEffect(() => {
    setActive(0);
  }, [value]);

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, []);

  const pick = (brand: Brand) => {
    onPick(brand);
    setOpen(false);
  };

  const showList = open && suggestions.length > 0;

  return (
    <div ref={rootRef} className="relative">
      <div className="flex items-center gap-2">
        {resolved ? <BrandGlyph brand={resolved} size="sm" /> : null}
        <Input
          id={id}
          className="min-w-0 flex-1"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList ? `${listId}-${suggestions[active]?.id}` : undefined}
          autoComplete="off"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (!showList) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((current) => (current + 1) % suggestions.length);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((current) => (current - 1 + suggestions.length) % suggestions.length);
            } else if (event.key === "Enter") {
              const brand = suggestions[active];
              if (brand) {
                event.preventDefault();
                pick(brand);
              }
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />
      </div>
      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-xl bg-surface py-1 shadow-border"
        >
          {suggestions.map((brand, index) => (
            <li key={brand.id} id={`${listId}-${brand.id}`} role="option" aria-selected={index === active}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2 text-left text-sm",
                  index === active ? "bg-bg" : "bg-surface",
                )}
                onMouseEnter={() => setActive(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pick(brand)}
              >
                <BrandGlyph brand={brand} size="sm" />
                <span className="font-medium">{brand.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
