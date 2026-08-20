import { currencyExponent, mulDivRound } from "~/lib/domain/money";

/** Quotes are integer fixed-point: `1 base = quotes[code] / scale` of `code`. */
export type FxTable = {
  base: string;
  asOf: string;
  scale: number;
  quotes: Record<string, number>;
};

export const FX_SCALE = 100_000_000;

export function fxTableFromRates(
  base: string,
  asOf: string,
  rates: Record<string, number>,
  scale = FX_SCALE,
): FxTable {
  const quotes: Record<string, number> = {};
  quotes[base.toUpperCase()] = scale;
  for (const [code, rate] of Object.entries(rates)) {
    if (!Number.isFinite(rate) || rate <= 0) continue;
    quotes[code.toUpperCase()] = Math.round(rate * scale);
  }
  return { base: base.toUpperCase(), asOf, scale, quotes };
}

export function quoteFor(currency: string, fx: FxTable): number | null {
  const quote = fx.quotes[currency.toUpperCase()];
  if (quote === undefined || quote <= 0) return null;
  return quote;
}

export function fxCovers(currencies: readonly string[], fx: FxTable): boolean {
  return currencies.every((code) => quoteFor(code, fx) !== null);
}

/**
 * Convert integer minor units. Rate math is integer (`mulDivRound`);
 * IEEE floats only appear when ingesting a market rate into `FxTable`.
 */
export function convertMinor(
  amount: number,
  from: string,
  to: string,
  fx: FxTable,
): number | null {
  const src = from.toUpperCase();
  const dst = to.toUpperCase();
  if (src === dst) return amount;
  const fromQuote = quoteFor(src, fx);
  const toQuote = quoteFor(dst, fx);
  if (fromQuote === null || toQuote === null) return null;
  const expDelta = currencyExponent(dst) - currencyExponent(src);
  if (expDelta >= 0) {
    return mulDivRound(amount, toQuote * 10 ** expDelta, fromQuote);
  }
  return mulDivRound(amount, toQuote, fromQuote * 10 ** -expDelta);
}
