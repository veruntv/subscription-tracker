import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { todayInZone } from "~/lib/domain/civil-date";
import { applyStatus, buildSubscription } from "~/lib/domain/subscription";
import { CADENCES, CATEGORIES } from "~/lib/domain/types";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { subscriptions, users } from "~/server/db/schema";
import { civilToTimestamp, rowToSubscription } from "~/server/subscriptions/map";

const civilSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
});

const inputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  cadence: z.enum(CADENCES),
  intervalCount: z.number().int().min(1).max(24),
  startedAt: civilSchema,
  category: z.enum(CATEGORIES),
  cancelUrl: z.string().url().nullable(),
  notifyDaysBefore: z.number().int().min(0).max(30),
});

async function userToday(database: typeof db, userId: string) {
  const row = await database
    .select({ timezone: users.timezone })
    .from(users)
    .where(eq(users.id, userId))
    .then((rows) => rows[0]);
  return todayInZone(row?.timezone ?? "UTC");
}

export const subscriptionRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.session.user.id));
    return rows.map(rowToSubscription);
  }),

  create: protectedProcedure.input(inputSchema).mutation(async ({ ctx, input }) => {
    const built = buildSubscription(input, crypto.randomUUID(), undefined, await userToday(ctx.db, ctx.session.user.id));
    await ctx.db.insert(subscriptions).values({
      id: built.id,
      userId: ctx.session.user.id,
      name: built.name,
      amount: built.amount,
      currency: built.currency,
      cadence: built.cadence,
      intervalCount: built.intervalCount,
      anchorDay: built.anchorDay,
      startedAt: civilToTimestamp(built.startedAt),
      nextChargeAt: civilToTimestamp(built.nextChargeAt),
      status: built.status,
      notifyDaysBefore: built.notifyDaysBefore,
      category: built.category,
      cancelUrl: built.cancelUrl,
    });
    return built;
  }),

  update: protectedProcedure
    .input(inputSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.id, input.id),
            eq(subscriptions.userId, ctx.session.user.id),
          ),
        )
        .then((rows) => rows[0]);
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Subscription not found" });
      }
      const built = buildSubscription(
        input,
        input.id,
        existing.createdAt.toISOString(),
        await userToday(ctx.db, ctx.session.user.id),
      );
      await ctx.db
        .update(subscriptions)
        .set({
          name: built.name,
          amount: built.amount,
          currency: built.currency,
          cadence: built.cadence,
          intervalCount: built.intervalCount,
          anchorDay: built.anchorDay,
          startedAt: civilToTimestamp(built.startedAt),
          nextChargeAt: civilToTimestamp(built.nextChargeAt),
          notifyDaysBefore: built.notifyDaysBefore,
          category: built.category,
          cancelUrl: built.cancelUrl,
        })
        .where(
          and(
            eq(subscriptions.id, input.id),
            eq(subscriptions.userId, ctx.session.user.id),
          ),
        );
      return built;
    }),

  setStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(["active", "paused", "canceled"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.id, input.id),
            eq(subscriptions.userId, ctx.session.user.id),
          ),
        )
        .then((rows) => rows[0]);
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Subscription not found" });
      }
      const built = applyStatus(
        rowToSubscription(existing),
        input.status,
        await userToday(ctx.db, ctx.session.user.id),
      );
      await ctx.db
        .update(subscriptions)
        .set({
          status: built.status,
          nextChargeAt: civilToTimestamp(built.nextChargeAt),
        })
        .where(
          and(
            eq(subscriptions.id, input.id),
            eq(subscriptions.userId, ctx.session.user.id),
          ),
        );
      return { ok: true as const };
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(subscriptions)
        .where(
          and(
            eq(subscriptions.id, input.id),
            eq(subscriptions.userId, ctx.session.user.id),
          ),
        );
      return { ok: true as const };
    }),
});
