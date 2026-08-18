import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const healthRouter = createTRPCRouter({
  ok: publicProcedure.query(() => ({ ok: true as const })),
});
