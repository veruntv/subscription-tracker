"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { MailCheck } from "lucide-react";
import { signIn } from "next-auth/react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const intent = useSearchParams().get("intent");
  const signup = intent === "signup";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const submit = async () => {
    setStatus("sending");
    setMessage(null);
    const alreadySent = Boolean(sentTo);
    try {
      const result = await signIn("resend", {
        email,
        redirect: false,
        callbackUrl: "/",
      });
      if (result?.error) {
        setStatus("error");
        setMessage("Magic link is not configured yet. Come back once mail is connected.");
        return;
      }
      setSentTo(email);
      setStatus("sent");
      setResent(alreadySent);
      setMessage(null);
    } catch {
      setStatus("error");
      setMessage("Could not send a link. Try again in a moment.");
    }
  };

  const useDifferentEmail = () => {
    setSentTo(null);
    setStatus("idle");
    setResent(false);
    setMessage(null);
  };

  return (
    <main className="min-h-screen bg-bg text-fg">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-10 sm:px-10">
        {sentTo ? (
          <>
            <SentState
              email={sentTo}
              signup={signup}
              sending={status === "sending"}
              resent={resent}
              onResend={() => void submit()}
              onDifferentEmail={useDifferentEmail}
            />
            {status === "error" && message ? (
              <p
                role="alert"
                className="mt-4 rounded-2xl bg-surface px-4 py-3 text-sm text-danger shadow-border"
              >
                {message}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
              {signup ? "Get started" : "Account"}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {signup ? "Create an account" : "Sign in"}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              We email a one-time link. After you click it, this browser stays
              signed in for 30 days — no code to type, no password.
            </p>
            <form
              className="mt-8 space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                void submit();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              {status === "error" && message ? (
                <p
                  role="alert"
                  className="rounded-2xl bg-surface px-4 py-3 text-sm text-danger shadow-border"
                >
                  {message}
                </p>
              ) : null}
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={status === "sending" || !email}>
                  {status === "sending" ? "Sending…" : "Email me a link"}
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/">Back</Link>
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

function SentState({
  email,
  signup,
  sending,
  resent,
  onResend,
  onDifferentEmail,
}: {
  email: string;
  signup: boolean;
  sending: boolean;
  resent: boolean;
  onResend: () => void;
  onDifferentEmail: () => void;
}) {
  return (
    <div aria-live="polite">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
        {signup ? "Get started" : "Account"}
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Check your email</h1>
      <div className="mt-8 rounded-2xl bg-surface p-6 shadow-border">
        <div className="flex size-12 items-center justify-center rounded-full bg-accent">
          <MailCheck className="size-6 text-ink" aria-hidden />
        </div>
        <p className="mt-5 text-sm font-medium text-fg">
          {resent ? "Another sign-in link is on its way to" : "We sent a sign-in link to"}
        </p>
        <p className="mt-1 break-all text-lg font-semibold">{email}</p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Open that message and click the link. This browser stays signed in for
          30 days. If it is not there in a minute, look in spam.
        </p>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button onClick={onResend} disabled={sending} variant="outline">
          {sending ? "Sending…" : "Send another link"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDifferentEmail}>
          Use a different email
        </Button>
        <Button asChild variant="ghost">
          <Link href="/">Back</Link>
        </Button>
      </div>
    </div>
  );
}
