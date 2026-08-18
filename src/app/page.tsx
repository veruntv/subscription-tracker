const APP_NAME = "Subscription Tracker";

export default function Home() {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-12 py-10">
        <header className="flex items-baseline justify-between gap-8 border-b border-border pb-6">
          <p className="font-display text-xl tracking-tight">{APP_NAME}</p>
          <p className="text-sm text-muted">Web · desktop</p>
        </header>

        <section className="flex flex-1 items-center">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-accent">
              Coming online
            </p>
            <h1 className="font-display text-6xl font-medium leading-[1.05] tracking-tight">
              {APP_NAME}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Recurring charges in one place. Totals, a calendar, and a reminder
              before the next deduction.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
