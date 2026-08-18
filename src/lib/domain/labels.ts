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
