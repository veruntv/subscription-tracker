"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export default function LoginPage() {
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
        setMessage(
          "Magic link is not configured yet. Use the demo from the home page — it needs no account.",
        );
        return;
      }
      setStatus("sent");
      setMessage("Check your inbox for the sign-in link.");
    } catch {
      setStatus("error");
      setMessage(
        "Could not send a link. The demo on the home page works without signing in.",
      );
    }
  };

  return (
    <main className="min-h-screen bg-bg text-fg">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-10">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
          Account
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight">Sign in</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          We email a one-time link. Until mail is connected, stay in the demo —
          your list already works on this device.
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
            <Link href="/">Back to the tracker</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
