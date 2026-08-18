import { todayUtcCivil } from "~/lib/domain/civil-date";
import { inferAnchorDay, nextChargeOnOrAfter } from "~/lib/domain/schedule";
import type { Subscription, UserSettings } from "~/lib/domain/types";

export const DEMO_SETTINGS: UserSettings = {
  timezone: "Europe/Chisinau",
  defaultCurrency: "EUR",
};

function stamp(
  partial: Omit<Subscription, "anchorDay" | "nextChargeAt" | "createdAt">,
): Subscription {
  const today = todayUtcCivil();
  const anchorDay = inferAnchorDay(partial.startedAt, partial.cadence);
  return {
    ...partial,
    anchorDay,
    nextChargeAt: nextChargeOnOrAfter({
      startedAt: partial.startedAt,
      cadence: partial.cadence,
      intervalCount: partial.intervalCount,
      anchorDay,
      from: today,
    }),
    createdAt: "2025-11-01T00:00:00.000Z",
  };
}

export function seedSubscriptions(): Subscription[] {
  return [
    stamp({
      id: "demo-netflix",
      name: "Netflix",
      amount: 1299,
      currency: "EUR",
      cadence: "monthly",
      intervalCount: 1,
      startedAt: { year: 2025, month: 3, day: 15 },
      status: "active",
      notifyDaysBefore: 3,
      category: "streaming",
      cancelUrl: "https://www.netflix.com/cancelplan",
    }),
    stamp({
      id: "demo-spotify",
      name: "Spotify",
      amount: 1099,
      currency: "EUR",
      cadence: "monthly",
      intervalCount: 1,
      startedAt: { year: 2025, month: 1, day: 4 },
      status: "active",
      notifyDaysBefore: 3,
      category: "streaming",
      cancelUrl: "https://www.spotify.com/account",
    }),
    stamp({
      id: "demo-gym",
      name: "Basic-Fit",
      amount: 2999,
      currency: "EUR",
      cadence: "monthly",
      intervalCount: 1,
      startedAt: { year: 2025, month: 6, day: 1 },
      status: "active",
      notifyDaysBefore: 5,
      category: "fitness",
      cancelUrl: null,
    }),
    stamp({
      id: "demo-hetzner",
      name: "Hetzner Cloud",
      amount: 1526,
      currency: "EUR",
      cadence: "monthly",
      intervalCount: 1,
      startedAt: { year: 2025, month: 1, day: 31 },
      status: "active",
      notifyDaysBefore: 3,
      category: "hosting",
      cancelUrl: "https://console.hetzner.cloud",
    }),
    stamp({
      id: "demo-icloud",
      name: "iCloud+",
      amount: 299,
      currency: "EUR",
      cadence: "monthly",
      intervalCount: 1,
      startedAt: { year: 2024, month: 9, day: 12 },
      status: "active",
      notifyDaysBefore: 2,
      category: "software",
      cancelUrl: null,
    }),
    stamp({
      id: "demo-domain",
      name: "domain.tld",
      amount: 1400,
      currency: "EUR",
      cadence: "yearly",
      intervalCount: 1,
      startedAt: { year: 2024, month: 11, day: 8 },
      status: "active",
      notifyDaysBefore: 14,
      category: "hosting",
      cancelUrl: null,
    }),
  ];
}
