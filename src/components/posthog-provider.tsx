"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, type ReactNode } from "react";

import { env } from "~/env";
import { posthogInitOptions, shouldInitPosthog } from "~/lib/posthog";

let pendingUserId: string | null = null;

export function PostHogProvider({ children }: { children: ReactNode }) {
  const key = env.NEXT_PUBLIC_POSTHOG_KEY;

  useEffect(() => {
    if (!shouldInitPosthog(key) || !key) return;
    if (posthog.__loaded) return;
    posthog.init(key, {
      ...posthogInitOptions(env.NEXT_PUBLIC_POSTHOG_HOST),
      loaded: (client) => {
        if (pendingUserId) client.identify(pendingUserId);
      },
    });
  }, [key]);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

export function PostHogIdentify({ userId }: { userId: string }) {
  useEffect(() => {
    if (!shouldInitPosthog(env.NEXT_PUBLIC_POSTHOG_KEY)) return;
    pendingUserId = userId;
    if (posthog.__loaded) posthog.identify(userId);
    return () => {
      if (pendingUserId === userId) pendingUserId = null;
    };
  }, [userId]);

  return null;
}
