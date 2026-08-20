import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Resend from "next-auth/providers/resend";

import { env } from "~/env";
import { db } from "~/server/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "~/server/db/schema";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

const resendProvider =
  env.AUTH_RESEND_KEY && env.EMAIL_FROM
    ? Resend({
        apiKey: env.AUTH_RESEND_KEY,
        from: env.EMAIL_FROM,
      })
    : undefined;

export const authConfig = {
  providers: resendProvider ? [resendProvider] : [],
  adapter: env.DATABASE_URL
    ? DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
      })
    : undefined,
  trustHost: true,
  session: env.DATABASE_URL
    ? {
        strategy: "database" as const,
        maxAge: 60 * 60 * 24 * 30,
        updateAge: 60 * 60 * 24,
      }
    : {
        strategy: "jwt" as const,
        maxAge: 60 * 60 * 24 * 30,
      },
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
} satisfies NextAuthConfig;
