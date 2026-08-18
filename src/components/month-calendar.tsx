import { ChevronLeft, ChevronRight } from "lucide-react";

import { MerchantMark } from "~/components/merchant-mark";
import { Button } from "~/components/ui/button";
import { daysInMonth, formatCivil } from "~/lib/domain/civil-date";
import { formatMinor } from "~/lib/domain/money";
import { occurrencesInMonth } from "~/lib/domain/schedule";
import type { CivilDate, Subscription } from "~/lib/domain/types";
import { cn } from "~/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function leadingBlanks(year: number, month: number): number {
  const weekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return weekday === 0 ? 6 : weekday - 1;
}

function padWeeks<T>(cells: T[]): T[] {
  const trailing = (7 - (cells.length % 7)) % 7;
  return trailing === 0 ? cells : [...cells, ...Array.from({ length: trailing }, () => null as T)];
}

export function MonthCalendar({
  year,
  month,
  today,
  items,
  onPrev,
  onNext,
}: {
  year: number;
  month: number;
  today: CivilDate;
  items: readonly Subscription[];
  onPrev: () => void;
  onNext: () => void;
}) {
  const dim = daysInMonth(year, month);
  const blanks = leadingBlanks(year, month);
  const cells = padWeeks< { day: number; charges: Subscription[] } | null >([
    ...Array.from({ length: blanks }, () => null),
    ...Array.from({ length: dim }, (_, index) => {
      const day = index + 1;
      const charges = items.filter((item) =>
        occurrencesInMonth(item, year, month).some((date) => date.day === day),
      );
      return { day, charges };
    }),
  ]);

  const monthCharges = items
    .flatMap((item) =>
      occurrencesInMonth(item, year, month).map((date) => ({ item, date })),
    )
    .sort((a, b) => a.date.day - b.date.day || a.item.name.localeCompare(b.item.name));

  return (
    <section id="calendar" className="rounded-2xl bg-surface p-6 shadow-border">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">Calendar</p>
          <h2 className="text-xl font-semibold tracking-tight">{monthLabel(year, month)}</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={onPrev} aria-label="Previous month">
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon" onClick={onNext} aria-label="Next month">
            <ChevronRight />
          </Button>
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-7 border-b border-border bg-bg text-center text-xs font-medium text-muted">
          {WEEKDAYS.map((day) => (
            <div key={day} className="px-2 py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 [grid-template-columns:repeat(7,minmax(0,1fr))]">
          {cells.map((cell, index) => {
            if (!cell) {
              return (
                <div
                  key={`blank-${index}`}
                  className="min-h-28 border-b border-r border-border bg-bg/40 [&:nth-child(7n)]:border-r-0"
                />
              );
            }
            const isToday =
              today.year === year && today.month === month && today.day === cell.day;
            const hasCharge = cell.charges.length > 0;
            const currencies = [...new Set(cell.charges.map((item) => item.currency))];
            const dayTotal =
              currencies.length === 1
                ? cell.charges.reduce((sum, item) => sum + item.amount, 0)
                : null;
            return (
              <div
                key={cell.day}
                className={cn(
                  "min-h-28 min-w-0 border-b border-r border-border p-2 [&:nth-child(7n)]:border-r-0",
                  isToday && "bg-accent-soft",
                  !isToday && hasCharge && "bg-charge",
                  !isToday && !hasCharge && "bg-surface",
                )}
              >
                <p
                  className={cn(
                    "inline-flex min-w-6 items-center justify-center text-xs tabular-nums",
                    isToday &&
                      "h-6 rounded-full bg-accent px-1.5 font-semibold text-ink",
                    !isToday && hasCharge && "font-semibold text-grape",
                    !isToday && !hasCharge && "text-muted",
                  )}
                >
                  {cell.day}
                </p>
                {cell.charges.length > 0 ? (
                  <ul className="mt-1.5 space-y-1">
                    {cell.charges.map((item) => (
                      <li key={`${item.id}-${cell.day}`} className="min-w-0">
                        <p className="truncate text-[11px] font-medium leading-tight" title={item.name}>
                          {item.name}
                        </p>
                        <p className="text-[11px] tabular-nums leading-tight text-muted">
                          {formatMinor(item.amount, item.currency)}
                        </p>
                      </li>
                    ))}
                    {dayTotal !== null && cell.charges.length > 1 ? (
                      <li className="text-[11px] tabular-nums text-muted">
                        {formatMinor(dayTotal, currencies[0]!)} total
                      </li>
                    ) : null}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <ul className="mt-5 divide-y divide-border">
        {monthCharges.length === 0 ? (
          <li className="py-3 text-sm text-muted">No charges this month.</li>
        ) : (
          monthCharges.map(({ item, date }) => (
            <li key={`${item.id}-${date.day}`} className="flex items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3">
                <MerchantMark name={item.name} category={item.category} size="sm" />
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted">{formatCivil(date)}</p>
                </div>
              </div>
              <p className="text-sm tabular-nums">{formatMinor(item.amount, item.currency)}</p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

export function shiftMonth(year: number, month: number, delta: number): CivilDate {
  const index = year * 12 + (month - 1) + delta;
  return {
    year: Math.floor(index / 12),
    month: (index % 12) + 1,
    day: 1,
  };
}
