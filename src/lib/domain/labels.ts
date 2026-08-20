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

export const CATEGORY_TONES: Record<Category, { bg: string; fg: string }> = {
  streaming: { bg: "bg-orange", fg: "text-ink" },
  fitness: { bg: "bg-moss", fg: "text-lilac" },
  software: { bg: "bg-periwinkle", fg: "text-lilac" },
  hosting: { bg: "bg-teal", fg: "text-ink" },
  housing: { bg: "bg-rose", fg: "text-ink" },
  utilities: { bg: "bg-steel", fg: "text-lilac" },
  news: { bg: "bg-ochre", fg: "text-ink" },
  other: { bg: "bg-mauve", fg: "text-lilac" },
};

export function categoryTone(category: Category | "remainder"): { bg: string; fg: string } {
  if (category === "remainder") return CATEGORY_TONES.other;
  return CATEGORY_TONES[category];
}

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
