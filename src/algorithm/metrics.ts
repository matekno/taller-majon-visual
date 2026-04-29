import { TALLERES } from '../data/types'
import type { Talmid, Assignment } from '../data/types'

export function groupSizes(assignment: Assignment): number[] {
  const sizes = new Array(TALLERES.length).fill(0)
  for (const t of assignment) sizes[t]++
  return sizes
}

export function prefScore(talmidim: Talmid[], assignment: Assignment): number {
  if (talmidim.length === 0 || assignment.length !== talmidim.length) return 0
  let sum = 0
  for (let i = 0; i < talmidim.length; i++) {
    sum += talmidim[i].scores[assignment[i]] || 0
  }
  return sum / (talmidim.length * 5)
}

export function eqScore(assignment: Assignment): number {
  if (assignment.length === 0) return 1
  const sizes = groupSizes(assignment)
  const mean = assignment.length / TALLERES.length
  if (mean === 0) return 1
  const variance =
    sizes.reduce((acc, s) => acc + (s - mean) ** 2, 0) / sizes.length
  const std = Math.sqrt(variance)
  return Math.max(0, Math.min(1, 1 - std / mean))
}

export function mixScore(talmidim: Talmid[], assignment: Assignment): number {
  if (talmidim.length === 0 || assignment.length !== talmidim.length) return 1
  const allKitot = new Set(talmidim.map((t) => t.kita))
  const K = allKitot.size
  if (K <= 1) return 1
  const maxEntropy = Math.log(K)

  const buckets: Map<string, number>[] = TALLERES.map(() => new Map())
  for (let i = 0; i < talmidim.length; i++) {
    const taller = assignment[i]
    const kita = talmidim[i].kita
    const m = buckets[taller]
    m.set(kita, (m.get(kita) || 0) + 1)
  }

  let total = 0
  let counted = 0
  for (const m of buckets) {
    const size = Array.from(m.values()).reduce((a, b) => a + b, 0)
    if (size === 0) continue
    let H = 0
    for (const c of m.values()) {
      const p = c / size
      H -= p * Math.log(p)
    }
    total += H / maxEntropy
    counted++
  }
  return counted === 0 ? 1 : total / counted
}
