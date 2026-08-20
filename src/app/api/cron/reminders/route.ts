import { env } from "~/env";
import { getDailyFxRates } from "~/server/fx/rates";
import { runReminders } from "~/server/reminders/run";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (env.CRON_SECRET) {
    const header = request.headers.get("authorization");
    if (header !== `Bearer ${env.CRON_SECRET}`) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const [result, fx] = await Promise.all([runReminders(), getDailyFxRates()]);
  return Response.json({ ok: true, fx: Boolean(fx), ...result });
}
