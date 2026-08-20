import { BRANDS, type Brand } from "~/lib/domain/brand-catalog";

export type { Brand };
export { BRANDS };

export function normalizeBrandQuery(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function keysFor(brand: Brand): string[] {
  return [normalizeBrandQuery(brand.name), ...brand.aliases.map(normalizeBrandQuery)].filter(
    (key) => key.length > 0,
  );
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j] ?? 0;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min((row[j] ?? 0) + 1, (row[j - 1] ?? 0) + 1, previous + cost);
      previous = current;
    }
  }
  return row[b.length] ?? b.length;
}

function scoreBrand(brand: Brand, query: string): number | null {
  let best: number | null = null;
  const maxDistance = query.length >= 8 ? 2 : 1;
  for (const key of keysFor(brand)) {
    let score: number | null = null;
    if (key === query) score = 0;
    else if (key.startsWith(query)) score = 1;
    else if (query.startsWith(`${key} `) && key.length >= 3) score = 2;
    else if (key.split(" ").some((word) => word.startsWith(query))) score = 3;
    else if (query.length >= 3 && key.includes(query)) score = 4;
    else if (query.length >= 4) {
      const distance = levenshtein(query, key);
      if (distance <= maxDistance) score = 10 + distance;
    }
    if (score !== null && (best === null || score < best)) best = score;
  }
  return best;
}

export function suggestBrands(query: string, limit = 8): Brand[] {
  const normalized = normalizeBrandQuery(query);
  if (normalized.length === 0) return [];
  return BRANDS.map((brand, index) => ({ brand, index, score: scoreBrand(brand, normalized) }))
    .filter((row) => row.score !== null)
    .sort((a, b) => (a.score ?? 99) - (b.score ?? 99) || a.index - b.index)
    .slice(0, limit)
    .map((row) => row.brand);
}

export function resolveBrand(name: string): Brand | null {
  const query = normalizeBrandQuery(name);
  if (query.length === 0) return null;

  for (const brand of BRANDS) {
    const nameKey = normalizeBrandQuery(brand.name);
    if (nameKey === query || query.startsWith(`${nameKey} `)) return brand;
    for (const alias of brand.aliases) {
      const key = normalizeBrandQuery(alias);
      if (key === query) return brand;
      if (key.length >= 6 && query.startsWith(`${key} `)) return brand;
    }
  }

  const prefixed = BRANDS.filter((brand) =>
    keysFor(brand).some((key) => key.startsWith(query) && query.length >= 4),
  );
  if (prefixed.length === 1) return prefixed[0] ?? null;

  if (query.length < 5) return null;
  const maxDistance = query.length >= 8 ? 2 : 1;
  const fuzzy = BRANDS.map((brand) => ({
    brand,
    distance: Math.min(...keysFor(brand).map((key) => levenshtein(query, key))),
  }))
    .filter((row) => row.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance);
  if (fuzzy.length === 1 || (fuzzy[0] && fuzzy[1] && fuzzy[0].distance < fuzzy[1].distance)) {
    return fuzzy[0]?.brand ?? null;
  }
  return null;
}
