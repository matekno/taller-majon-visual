export function parseScore(raw: unknown): number {
  if (raw == null) return 0
  const s = String(raw).trim()
  if (!s) return 0
  const match = s.match(/[1-5]/)
  return match ? Number(match[0]) : 0
}
