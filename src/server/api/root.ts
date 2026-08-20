import { fxRouter } from "~/server/api/routers/fx";
import { healthRouter } from "~/server/api/routers/health";
import { settingsRouter } from "~/server/api/routers/settings";
import { subscriptionRouter } from "~/server/api/routers/subscription";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
  health: healthRouter,
  subscription: subscriptionRouter,
  settings: settingsRouter,
  fx: fxRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
