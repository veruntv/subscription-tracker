import { Landing } from "~/components/landing";
import { PostHogIdentify } from "~/components/posthog-provider";
import { TrackerApp } from "~/components/tracker-app";
import { env } from "~/env";

export default async function Home() {
  let signedIn = false;
  let email: string | null = null;
  let userId: string | null = null;

  if (env.AUTH_SECRET) {
    try {
      const { auth } = await import("~/server/auth");
      const session = await auth();
      signedIn = Boolean(session?.user);
      email = session?.user.email ?? null;
      userId = session?.user.id ?? null;
    } catch {
      signedIn = false;
    }
  }

  if (!signedIn) {
    return <Landing />;
  }

  return (
    <>
      {userId ? <PostHogIdentify userId={userId} /> : null}
      <TrackerApp
        accountReady={Boolean(env.DATABASE_URL)}
        signedIn
        email={email}
        magicLinkReady={Boolean(env.AUTH_RESEND_KEY && env.EMAIL_FROM)}
      />
    </>
  );
}
