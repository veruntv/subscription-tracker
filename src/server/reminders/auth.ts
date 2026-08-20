export function cronAuthorized(
  secret: string | undefined,
  header: string | null,
): boolean {
  if (!secret) return false;
  return header === `Bearer ${secret}`;
}
