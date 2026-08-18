import type { Cadence } from "~/lib/domain/types";

const YEARLY_MULTIPLIER: Record<Cadence, number> = {
  weekly: 52,
  monthly: 12,
  quarterly: 4,
  yearly: 1,
};

const ZERO_DECIMAL = new Set(["JPY", "KRW", "VND", "CLP"]);

export function currencyExponent(currency: string): number {
  return ZERO_DECIMAL.has(currency.toUpperCase()) ? 0 : 2;
}

export function yearlyMultiplier(cadence: Cadence): number {
  return YEARLY_MULTIPLIER[cadence];
}

/** Integer round(a * b / d) using BigInt — no IEEE floats on money. */
export function mulDivRound(amount: number, numerator: number, denominator: number): number {
  if (denominator === 0) {
    throw new Error("division by zero");
  }
  const sign = amount < 0 ? -1n : 1n;
  const prod = BigInt(Math.abs(amount)) * BigInt(numerator);
  const den = BigInt(denominator);
  const half = den / 2n;
  return Number(sign * ((prod + half) / den));
}

export function yearlyMinor(
  amount: number,
  cadence: Cadence,
  intervalCount: number,
): number {
  return mulDivRound(amount, yearlyMultiplier(cadence), intervalCount);
}

export function monthlyMinor(
  amount: number,
  cadence: Cadence,
  intervalCount: number,
): number {
  return mulDivRound(yearlyMinor(amount, cadence, intervalCount), 1, 12);
}

export function formatMinor(amount: number, currency: string): string {
  const code = currency.toUpperCase();
  const exp = currencyExponent(code);
  const abs = Math.abs(amount);
  const whole = Math.trunc(abs / 10 ** exp);
  const frac = abs % 10 ** exp;
  const sign = amount < 0 ? "−" : "";
  const body =
    exp === 0
      ? String(whole)
      : `${whole}.${String(frac).padStart(exp, "0")}`;
  return `${sign}${body} ${code}`;
}

export function parseAmountInput(text: string, currency: string): number | null {
  const trimmed = text.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const exp = currencyExponent(currency);
  const [wholeRaw, fracRaw = ""] = trimmed.split(".");
  if (fracRaw.length > exp) return null;
  const frac = (fracRaw + "0".repeat(exp)).slice(0, exp);
  const minor = Number(wholeRaw) * 10 ** exp + (exp === 0 ? 0 : Number(frac));
  if (!Number.isInteger(minor) || minor <= 0) return null;
  return minor;
}

export function minorToInput(amount: number, currency: string): string {
  const exp = currencyExponent(currency);
  if (exp === 0) return String(amount);
  const whole = Math.trunc(amount / 10 ** exp);
  const frac = amount % 10 ** exp;
  return `${whole}.${String(frac).padStart(exp, "0")}`;
}
