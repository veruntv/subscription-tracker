import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getDailyFxRates } from "~/server/fx/rates";

export const fxRouter = createTRPCRouter({
  today: protectedProcedure.query(async () => getDailyFxRates()),
});
