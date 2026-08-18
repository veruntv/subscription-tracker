import type { Cadence, Category, Status } from "~/lib/domain/types";

export const CATEGORY_LABELS: Record<Category, string> = {
  streaming: "Streaming",
  fitness: "Fitness",
  software: "Software",
  hosting: "Hosting",
  housing: "Housing",
  utilities: "Utilities",
  news: "News",
  other: "Other",
};

export const MIX_TONES = ["bg-orange", "bg-grape", "bg-teal"] as const;
export const MARK_TEXT = ["text-ink", "text-lilac", "text-ink"] as const;

export function mixTone(index: number): string {
  return MIX_TONES[index % MIX_TONES.length] ?? "bg-grape";
}

export function markTone(name: string): { bg: string; fg: string } {
  let hash = 0;
  for (const char of name) {
    hash = (hash + char.charCodeAt(0)) % MIX_TONES.length;
  }
  return {
    bg: MIX_TONES[hash] ?? "bg-grape",
    fg: MARK_TEXT[hash] ?? "text-lilac",
  };
}

export const CATEGORY_TONES: Record<Category, string> = {
  streaming: "bg-orange",
  fitness: "bg-grape",
  software: "bg-teal",
  hosting: "bg-orange",
  housing: "bg-grape",
  utilities: "bg-teal",
  news: "bg-orange",
  other: "bg-grape",
};

export const CADENCE_LABELS: Record<Cadence, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

export const STATUS_LABELS: Record<Status, string> = {
  active: "Active",
  paused: "Paused",
  canceled: "Canceled",
};

export const CURRENCIES = ["EUR", "USD", "GBP", "MDL", "RON", "PLN", "CHF", "JPY"] as const;

export const TIMEZONES = [
  "Europe/Chisinau",
  "Europe/Bucharest",
  "Europe/Berlin",
  "Europe/London",
  "Europe/Paris",
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Tokyo",
] as const;

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
