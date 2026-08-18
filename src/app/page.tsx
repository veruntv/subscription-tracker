import { Landing } from "~/components/landing";
import { TrackerApp } from "~/components/tracker-app";
import { env } from "~/env";
import { auth } from "~/server/auth";

export default async function Home() {
  let signedIn = false;
  let email: string | null = null;

  if (env.AUTH_SECRET) {
    try {
      const session = await auth();
      signedIn = Boolean(session?.user);
      email = session?.user.email ?? null;
    } catch {
      signedIn = false;
    }
  }

  if (!signedIn) {
    return <Landing />;
  }

  return (
    <TrackerApp
      accountReady={Boolean(env.DATABASE_URL)}
      signedIn
      email={email}
      magicLinkReady={Boolean(env.AUTH_RESEND_KEY && env.EMAIL_FROM)}
    />
  );
}
