import { ChevronLeft, ChevronRight } from "lucide-react";

import { daysInMonth, formatCivil } from "~/lib/domain/civil-date";
import { formatMinor } from "~/lib/domain/money";
import { occurrencesInMonth } from "~/lib/domain/schedule";
import type { CivilDate, Subscription } from "~/lib/domain/types";
import { Button } from "~/components/ui/button";

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
  const cells: Array<{ day: number; charges: Subscription[] } | null> = [
    ...Array.from({ length: blanks }, () => null),
    ...Array.from({ length: dim }, (_, index) => {
      const day = index + 1;
      const charges = items.filter((item) =>
        occurrencesInMonth(item, year, month).some((date) => date.day === day),
      );
      return { day, charges };
    }),
  ];

  return (
    <section className="overflow-hidden rounded-2xl bg-surface p-5 shadow-border">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
            Calendar
          </p>
          <h2 className="font-display text-2xl tracking-tight">{monthLabel(year, month)}</h2>
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

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell, index) => {
          if (!cell) {
            return <div key={`blank-${index}`} className="min-h-20 rounded-md" />;
          }
          const isToday =
            today.year === year && today.month === month && today.day === cell.day;
          return (
            <div
              key={cell.day}
              className={`min-h-20 min-w-0 overflow-hidden rounded-md px-1.5 py-1.5 text-left ${
                isToday ? "bg-bg" : "bg-transparent"
              }`}
            >
              <p className={`text-xs tabular-nums ${isToday ? "text-accent" : "text-muted"}`}>
                {cell.day}
              </p>
              <ul className="mt-1 space-y-0.5">
                {cell.charges.map((item) => (
                  <li key={`${item.id}-${cell.day}`} className="truncate text-[10px] leading-tight">
                    <span className="text-fg">{item.name}</span>
                    <span className="block truncate text-muted">
                      {formatMinor(item.amount, item.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-muted">
        Today {formatCivil(today)}. Charge dates use the 31st-anchor rule.
      </p>
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
