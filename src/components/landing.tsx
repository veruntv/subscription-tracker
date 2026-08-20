import Link from "next/link";

import { BrandGlyph } from "~/components/brand-glyph";
import { Button } from "~/components/ui/button";
import { resolveBrand } from "~/lib/domain/brands";
import { CATEGORY_TONES } from "~/lib/domain/labels";

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
            <p className="text-sm text-muted">Recurring charges, in one list</p>
            <h1 className="mt-3 text-5xl font-semibold tracking-tight">
              See the charge before it leaves the account.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
              Netflix, the gym, hosting — one list. What is due this month, what
              it costs per year, the dates on a calendar, and an email a few days
              before.
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
            body="Name, amount, how often, first charge. Pause or cancel anytime."
          />
          <Step
            n="02"
            title="See the month"
            body="Invoices that actually land, a yearly total, and a mix by category."
          />
          <Step
            n="03"
            title="Get a reminder"
            body="One email at 9:00 in your timezone, a few days before the charge."
          />
        </section>

        <section className="mt-20 grid grid-cols-2 gap-6">
          <article className="rounded-2xl bg-surface p-8 shadow-border">
            <p className="text-sm text-muted">Calendar</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              This month, on a calendar
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Each charge on the day it actually bills.
            </p>
          </article>
          <article className="rounded-2xl bg-surface p-8 shadow-border">
            <p className="text-sm text-muted">Reminders</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              One email per charge
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Name, amount, date, and the cancel link if you saved one.
            </p>
          </article>
        </section>

        <section className="mt-20 rounded-2xl bg-grape px-12 py-14 text-lilac">
          <p className="text-sm text-thistle">No bank login. No payments.</p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight">
            You keep the list. We don&apos;t touch the bank.
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
      <p className="text-sm text-muted">Charged this month</p>
      <p className="mt-2 text-5xl font-semibold tabular-nums tracking-tight">73.39 EUR</p>
      <div className="mt-6 flex h-2.5 gap-1 overflow-hidden rounded-full">
        <span className={`h-full min-w-1 ${CATEGORY_TONES.fitness.bg}`} style={{ flexGrow: 4 }} />
        <span className={`h-full min-w-1 ${CATEGORY_TONES.streaming.bg}`} style={{ flexGrow: 3 }} />
        <span className={`h-full min-w-1 ${CATEGORY_TONES.hosting.bg}`} style={{ flexGrow: 2 }} />
      </div>
      <p className="mt-3 flex gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className={`size-2 rounded-full ${CATEGORY_TONES.fitness.bg}`} />
          Fitness <span className="text-fg">29.99</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className={`size-2 rounded-full ${CATEGORY_TONES.streaming.bg}`} />
          Streaming <span className="text-fg">23.98</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className={`size-2 rounded-full ${CATEGORY_TONES.hosting.bg}`} />
          Hosting <span className="text-fg">16.43</span>
        </span>
      </p>
      <ul className="mt-6 space-y-3 border-t border-border pt-5">
        <MockRow name="Basic-Fit" date="22 Aug" amount="29.99 EUR" tone={CATEGORY_TONES.fitness.bg} />
        <MockRow name="Netflix" date="25 Aug" amount="13.99 EUR" tone={CATEGORY_TONES.streaming.bg} />
        <MockRow name="Hetzner" date="31 Aug" amount="15.26 EUR" tone={CATEGORY_TONES.hosting.bg} />
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
  const brand = resolveBrand(name);
  return (
    <li className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {brand ? <BrandGlyph brand={brand} /> : <span className={`size-8 rounded-full ${tone}`} />}
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted">{date}</p>
        </div>
      </div>
      <p className="text-sm tabular-nums">{amount}</p>
    </li>
  );
}
