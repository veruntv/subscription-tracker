import { fxTableFromRates, type FxTable } from "~/lib/domain/fx";

const FX_URL = "https://open.er-api.com/v6/latest/USD";

type Cache = {
  date: string;
  table: FxTable;
};

let todayCache: Cache | null = null;
let lastGood: FxTable | null = null;

export function resetFxCacheForTests() {
  todayCache = null;
  lastGood = null;
}

function utcDate(now: Date): string {
  return now.toISOString().slice(0, 10);
}

function parseAsOf(utcHeader: unknown, fallback: string): string {
  if (typeof utcHeader !== "string") return fallback;
  const parsed = new Date(utcHeader);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toISOString().slice(0, 10);
}

function parseTable(body: unknown, fallbackDate: string): FxTable | null {
  if (!body || typeof body !== "object") return null;
  const row = body as {
    result?: unknown;
    base_code?: unknown;
    rates?: unknown;
    time_last_update_utc?: unknown;
  };
  if (row.result !== "success") return null;
  if (typeof row.base_code !== "string") return null;
  if (!row.rates || typeof row.rates !== "object") return null;
  const rates: Record<string, number> = {};
  for (const [code, value] of Object.entries(row.rates as Record<string, unknown>)) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      rates[code] = value;
    }
  }
  if (Object.keys(rates).length === 0) return null;
  return fxTableFromRates(
    row.base_code,
    parseAsOf(row.time_last_update_utc, fallbackDate),
    rates,
  );
}

function remember(date: string, table: FxTable | null): FxTable | null {
  if (!table) return null;
  todayCache = { date, table };
  return table;
}

export async function getDailyFxRates(
  now = new Date(),
  fetchImpl: typeof fetch = fetch,
): Promise<FxTable | null> {
  const date = utcDate(now);
  if (todayCache?.date === date) return todayCache.table;

  try {
    const response = await fetchImpl(FX_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return remember(date, lastGood);
    const table = parseTable(await response.json(), date);
    if (!table) return remember(date, lastGood);
    lastGood = table;
    return remember(date, table);
  } catch {
    return remember(date, lastGood);
  }
}
