import { eq } from "drizzle-orm";
import { z } from "zod";

import { CURRENCIES, TIMEZONES } from "~/lib/domain/labels";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { users } from "~/server/db/schema";

export const settingsRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const row = await ctx.db
      .select({
        timezone: users.timezone,
        defaultCurrency: users.defaultCurrency,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, ctx.session.user.id))
      .then((rows) => rows[0]);
    return {
      timezone: row?.timezone ?? "UTC",
      defaultCurrency: row?.defaultCurrency ?? "USD",
      email: row?.email ?? ctx.session.user.email ?? "",
    };
  }),

  update: protectedProcedure
    .input(
      z.object({
        timezone: z.enum(TIMEZONES),
        defaultCurrency: z.enum(CURRENCIES),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(users)
        .set({
          timezone: input.timezone,
          defaultCurrency: input.defaultCurrency.toUpperCase(),
        })
        .where(eq(users.id, ctx.session.user.id));
      return { ok: true as const };
    }),
});
