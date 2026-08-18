import { env } from "~/env";
import { runReminders } from "~/server/reminders/run";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (env.CRON_SECRET) {
    const header = request.headers.get("authorization");
    if (header !== `Bearer ${env.CRON_SECRET}`) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const result = await runReminders();
  return Response.json({ ok: true, ...result });
}
