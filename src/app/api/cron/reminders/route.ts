import { env } from "~/env";
import { getDailyFxRates } from "~/server/fx/rates";
import { cronAuthorized } from "~/server/reminders/auth";
import { runReminders } from "~/server/reminders/run";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!cronAuthorized(env.CRON_SECRET, request.headers.get("authorization"))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const [result, fx] = await Promise.all([runReminders(), getDailyFxRates()]);
  return Response.json({ ok: true, fx: Boolean(fx), ...result });
}
