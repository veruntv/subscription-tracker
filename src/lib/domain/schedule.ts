import {
  addDays,
  addMonths,
  applyAnchor,
  compareCivil,
  daysInMonth,
  isoWeekday,
} from "~/lib/domain/civil-date";
import type { Cadence, CivilDate, Subscription } from "~/lib/domain/types";

export function monthsPerInterval(cadence: Cadence, intervalCount: number): number {
  if (cadence === "monthly") return intervalCount;
  if (cadence === "quarterly") return 3 * intervalCount;
  if (cadence === "yearly") return 12 * intervalCount;
  return 0;
}

export function inferAnchorDay(startedAt: CivilDate, cadence: Cadence): number {
  return cadence === "weekly" ? isoWeekday(startedAt) : startedAt.day;
}

export function nextChargeOnOrAfter(input: {
  startedAt: CivilDate;
  cadence: Cadence;
  intervalCount: number;
  anchorDay: number;
  from: CivilDate;
}): CivilDate {
  const interval = Math.max(1, input.intervalCount);

  if (input.cadence === "weekly") {
    let cursor = input.startedAt;
    while (isoWeekday(cursor) !== input.anchorDay) {
      cursor = addDays(cursor, 1);
    }
    while (compareCivil(cursor, input.from) < 0) {
      cursor = addDays(cursor, 7 * interval);
    }
    return cursor;
  }

  const step = monthsPerInterval(input.cadence, interval);
  let occurrence = 0;
  let cursor = input.startedAt;
  while (compareCivil(cursor, input.from) < 0) {
    occurrence += 1;
    const base = addMonths(
      { year: input.startedAt.year, month: input.startedAt.month, day: 1 },
      step * occurrence,
      1,
    );
    cursor = applyAnchor(base.year, base.month, input.anchorDay);
  }
  return cursor;
}

export function occurrencesInMonth(
  subscription: Pick<
    Subscription,
    "startedAt" | "cadence" | "intervalCount" | "anchorDay" | "status"
  >,
  year: number,
  month: number,
): CivilDate[] {
  if (subscription.status !== "active") return [];

  const start = { year, month, day: 1 };
  const end = { year, month, day: daysInMonth(year, month) };
  const dates: CivilDate[] = [];
  let cursor = nextChargeOnOrAfter({
    startedAt: subscription.startedAt,
    cadence: subscription.cadence,
    intervalCount: subscription.intervalCount,
    anchorDay: subscription.anchorDay,
    from: start,
  });

  while (compareCivil(cursor, end) <= 0) {
    if (cursor.year === year && cursor.month === month) {
      dates.push(cursor);
    }
    cursor = nextChargeOnOrAfter({
      startedAt: subscription.startedAt,
      cadence: subscription.cadence,
      intervalCount: subscription.intervalCount,
      anchorDay: subscription.anchorDay,
      from: addDays(cursor, 1),
    });
  }

  return dates;
}
