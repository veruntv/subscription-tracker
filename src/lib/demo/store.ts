import { DEMO_SETTINGS, seedSubscriptions } from "~/lib/domain/seed";
import { applyStatus, buildSubscription } from "~/lib/domain/subscription";
import type { Subscription, SubscriptionInput, UserSettings } from "~/lib/domain/types";

const STORAGE_KEY = "subscription-tracker.demo.v1";

export type DemoState = {
  settings: UserSettings;
  subscriptions: Subscription[];
};

export function emptyDemoState(): DemoState {
  return {
    settings: { ...DEMO_SETTINGS },
    subscriptions: seedSubscriptions(),
  };
}

export function loadDemoState(): DemoState {
  if (typeof window === "undefined") return emptyDemoState();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = emptyDemoState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    const parsed = JSON.parse(raw) as DemoState;
    if (!parsed.settings || !Array.isArray(parsed.subscriptions)) {
      return emptyDemoState();
    }
    return parsed;
  } catch {
    return emptyDemoState();
  }
}

export function saveDemoState(state: DemoState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function addDemoSubscription(state: DemoState, input: SubscriptionInput): DemoState {
  const next: DemoState = {
    ...state,
    subscriptions: [
      buildSubscription(input, crypto.randomUUID()),
      ...state.subscriptions,
    ],
  };
  saveDemoState(next);
  return next;
}

export function updateDemoSubscription(
  state: DemoState,
  id: string,
  input: SubscriptionInput,
): DemoState {
  const existing = state.subscriptions.find((item) => item.id === id);
  const next: DemoState = {
    ...state,
    subscriptions: state.subscriptions.map((item) =>
      item.id === id
        ? buildSubscription(input, id, existing?.createdAt)
        : item,
    ),
  };
  saveDemoState(next);
  return next;
}

export function setDemoStatus(
  state: DemoState,
  id: string,
  status: Subscription["status"],
): DemoState {
  const next: DemoState = {
    ...state,
    subscriptions: state.subscriptions.map((item) =>
      item.id === id ? applyStatus(item, status) : item,
    ),
  };
  saveDemoState(next);
  return next;
}

export function removeDemoSubscription(state: DemoState, id: string): DemoState {
  const next: DemoState = {
    ...state,
    subscriptions: state.subscriptions.filter((item) => item.id !== id),
  };
  saveDemoState(next);
  return next;
}

export function updateDemoSettings(state: DemoState, settings: UserSettings): DemoState {
  const next = { ...state, settings };
  saveDemoState(next);
  return next;
}

export function resetDemoState(): DemoState {
  const next = emptyDemoState();
  saveDemoState(next);
  return next;
}
