/** An empty field stays empty. A typed 0 is a real zero. Only the last digit is kept. */
export function readGoal(raw: string): number | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const value = Number(digits.slice(-1));
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(9, value));
}
