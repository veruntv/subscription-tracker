import type { CivilDate } from "~/lib/domain/types";

export function civil(year: number, month: number, day: number): CivilDate {
  return { year, month, day };
}

export function civilFromUtc(date: Date): CivilDate {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

export function utcFromCivil(date: CivilDate): Date {
  return new Date(Date.UTC(date.year, date.month - 1, date.day));
}

export function civilToIso(date: CivilDate): string {
  const m = String(date.month).padStart(2, "0");
  const d = String(date.day).padStart(2, "0");
  return `${date.year}-${m}-${d}`;
}

export function civilFromIso(value: string): CivilDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return null;
  const dim = daysInMonth(year, month);
  if (day < 1 || day > dim) return null;
  return { year, month, day };
}

export function todayUtcCivil(): CivilDate {
  return civilFromUtc(new Date());
}

export function todayInZone(timeZone: string, now = new Date()): CivilDate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  if (!year || !month || !day) return todayUtcCivil();
  return { year, month, day };
}

export function compareCivil(a: CivilDate, b: CivilDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function isoWeekday(date: CivilDate): number {
  const day = utcFromCivil(date).getUTCDay();
  return day === 0 ? 7 : day;
}

export function addDays(date: CivilDate, days: number): CivilDate {
  const next = utcFromCivil(date);
  next.setUTCDate(next.getUTCDate() + days);
  return civilFromUtc(next);
}

export function applyAnchor(
  year: number,
  month: number,
  anchorDay: number,
): CivilDate {
  return {
    year,
    month,
    day: Math.min(anchorDay, daysInMonth(year, month)),
  };
}

export function addMonths(
  date: CivilDate,
  months: number,
  anchorDay: number,
): CivilDate {
  const index = date.year * 12 + (date.month - 1) + months;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return applyAnchor(year, month, anchorDay);
}

export function formatCivil(date: CivilDate): string {
  return utcFromCivil(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
