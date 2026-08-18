export const CADENCES = ["weekly", "monthly", "quarterly", "yearly"] as const;
export type Cadence = (typeof CADENCES)[number];

export const STATUSES = ["active", "paused", "canceled"] as const;
export type Status = (typeof STATUSES)[number];

export const CATEGORIES = [
  "streaming",
  "fitness",
  "software",
  "hosting",
  "housing",
  "utilities",
  "news",
  "other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export type CivilDate = {
  year: number;
  month: number;
  day: number;
};

export type Subscription = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  cadence: Cadence;
  intervalCount: number;
  anchorDay: number;
  startedAt: CivilDate;
  nextChargeAt: CivilDate;
  status: Status;
  notifyDaysBefore: number;
  category: Category;
  cancelUrl: string | null;
  createdAt: string;
};

export type UserSettings = {
  timezone: string;
  defaultCurrency: string;
};

export type SubscriptionInput = {
  name: string;
  amount: number;
  currency: string;
  cadence: Cadence;
  intervalCount: number;
  startedAt: CivilDate;
  category: Category;
  cancelUrl: string | null;
  notifyDaysBefore: number;
  status?: Status;
};
