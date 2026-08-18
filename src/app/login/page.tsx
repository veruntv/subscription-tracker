"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
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

  const submit = async () => {
    setStatus("sending");
    setMessage(null);
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
      setStatus("sent");
      setMessage("Check your inbox for the sign-in link.");
    } catch {
      setStatus("error");
      setMessage("Could not send a link. Try again in a moment.");
    }
  };

  return (
    <main className="min-h-screen bg-bg text-fg">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-10">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
          {signup ? "Get started" : "Account"}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          {signup ? "Create an account" : "Sign in"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          We email a one-time link. Same inbox flow for a first visit and a
          return. No password to remember.
        </p>
        <div className="mt-8 space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        {message ? (
          <p className={`mt-3 text-sm ${status === "error" ? "text-danger" : "text-muted"}`}>
            {message}
          </p>
        ) : null}
        <div className="mt-6 flex items-center gap-3">
          <Button onClick={() => void submit()} disabled={status === "sending" || !email}>
            {status === "sending" ? "Sending…" : "Email me a link"}
          </Button>
          <Button asChild variant="ghost">
            <Link href="/">Back</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
