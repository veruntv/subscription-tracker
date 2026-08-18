import Link from "next/link";

import { Button } from "~/components/ui/button";

export function Landing() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-10 py-6">
        <p className="text-sm font-semibold tracking-tight">Subscription Tracker</p>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/login?intent=signup">Get started</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-10 pb-24">
        <section className="grid grid-cols-12 items-center gap-12 pt-10">
          <div className="col-span-5">
            <p className="text-sm text-muted">Recurring spend, in one place</p>
            <h1 className="mt-3 text-5xl font-semibold tracking-tight">
              See the next charge before it hits.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
              One list for Netflix, the gym, hosting. Monthly and yearly totals,
              a calendar of deductions, and an email a few days before the money
              leaves.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <Button asChild>
                <Link href="/login?intent=signup">Create an account</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>

          <div className="col-span-7">
            <ProductMock />
          </div>
        </section>

        <section className="mt-24 grid grid-cols-3 gap-6">
          <Step
            n="01"
            title="Add what you pay"
            body="Name, amount, cadence, first charge. Pause or cancel without deleting the history of the idea."
          />
          <Step
            n="02"
            title="Watch the month"
            body="A calendar of the next deductions and a mix of where the money goes — gym, streaming, hosting."
          />
          <Step
            n="03"
            title="Get told in time"
            body="One email, N days before the charge, at 9:00 in your timezone. Never twice for the same date."
          />
        </section>

        <section className="mt-20 grid grid-cols-2 gap-6">
          <article className="rounded-2xl bg-surface p-8 shadow-border">
            <p className="text-sm text-muted">Calendar</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              The 31st stays the 31st
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Short months collapse to the last day, then snap back. Today is
              marked in lime. Charge days sit on a quiet thistle wash.
            </p>
          </article>
          <article className="rounded-2xl bg-surface p-8 shadow-border">
            <p className="text-sm text-muted">Reminders</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              One letter, then silence
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Name, amount, date, and the cancel link if you saved one. Retries
              of the hourly job cannot send a second copy.
            </p>
          </article>
        </section>

        <section className="mt-20 rounded-2xl bg-grape px-12 py-14 text-lilac">
          <p className="text-sm text-thistle">No bank login. No payments.</p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight">
            A list you keep. Not another app that spends for you.
          </h2>
          <div className="mt-8">
            <Button asChild>
              <Link href="/login?intent=signup">Start with your email</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <article className="rounded-2xl bg-surface p-6 shadow-border">
      <p className="text-xs font-medium tabular-nums text-muted">{n}</p>
      <h2 className="mt-3 text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </article>
  );
}

function ProductMock() {
  return (
    <div className="rounded-2xl bg-surface p-6 shadow-border">
      <p className="text-sm text-muted">This month</p>
      <p className="mt-2 text-5xl font-semibold tabular-nums tracking-tight">73.39 EUR</p>
      <div className="mt-6 flex h-2.5 gap-1 overflow-hidden rounded-full">
        <span className="h-full min-w-1 bg-orange" style={{ flexGrow: 4 }} />
        <span className="h-full min-w-1 bg-grape" style={{ flexGrow: 3 }} />
        <span className="h-full min-w-1 bg-teal" style={{ flexGrow: 2 }} />
      </div>
      <p className="mt-3 flex gap-4 text-xs text-muted">
        <span>
          Fitness <span className="text-fg">29.99</span>
        </span>
        <span>
          Streaming <span className="text-fg">23.98</span>
        </span>
        <span>
          Hosting <span className="text-fg">16.43</span>
        </span>
      </p>
      <ul className="mt-6 space-y-3 border-t border-border pt-5">
        <MockRow name="Basic-Fit" date="22 Aug" amount="29.99 EUR" tone="bg-orange" />
        <MockRow name="Netflix" date="25 Aug" amount="13.99 EUR" tone="bg-grape" />
        <MockRow name="Hetzner" date="31 Aug" amount="15.26 EUR" tone="bg-teal" />
      </ul>
    </div>
  );
}

function MockRow({
  name,
  date,
  amount,
  tone,
}: {
  name: string;
  date: string;
  amount: string;
  tone: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className={`size-8 rounded-full ${tone}`} />
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted">{date}</p>
        </div>
      </div>
      <p className="text-sm tabular-nums">{amount}</p>
    </li>
  );
}
